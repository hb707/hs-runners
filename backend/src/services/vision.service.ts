import Anthropic from '@anthropic-ai/sdk';
import sharp from 'sharp';
import { env } from '../config/env';
import type { VisionConfidence } from '../types';

const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

interface VisionResult {
  distanceKm: number | null;
  visionRaw: string | null;
  visionConfidence: VisionConfidence;
  recordedDate: string | null; // YYYY-MM-DD
}

const VISION_PROMPT = (currentYear: number) => `This is a screenshot from a Korean running app or GPS watch.
Extract the total running distance in kilometers and the date of the run.
Respond ONLY with a valid JSON object in this exact format:
{"distanceKm": <number or null>, "rawText": "<extracted text>", "confidence": "<high|medium|low|failed>", "recordedDate": "<YYYY-MM-DD or null>"}

Rules:
- distanceKm should be a number (e.g. 5.23) or null if not found
- If distance is shown in miles, convert to km (1 mile = 1.609 km)
- confidence: "high" if clearly readable, "medium" if partially readable, "low" if uncertain, "failed" if not found
- rawText: the exact text you found showing the distance
- recordedDate: the date shown in the screenshot in YYYY-MM-DD format. If only month/day is visible (e.g. "3/12" or "03.12"), assume the year is ${currentYear}. If no date is found, return null.`;

async function resizeImage(inputBuffer: Buffer): Promise<Buffer> {
  return sharp(inputBuffer)
    .resize({ width: 1500, height: 1500, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 70 })
    .toBuffer();
}

export async function analyzeRunningImage(inputBuffer: Buffer): Promise<VisionResult> {
  try {
    const imageBuffer = await resizeImage(inputBuffer);
    const base64Image = imageBuffer.toString('base64');

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: base64Image,
              },
            },
            { type: 'text', text: VISION_PROMPT(new Date().getFullYear()) },
          ],
        },
      ],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { distanceKm: null, visionRaw: null, visionConfidence: 'failed', recordedDate: null };
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      distanceKm: number | null;
      rawText: string;
      confidence: VisionConfidence;
      recordedDate: string | null;
    };

    return {
      distanceKm: typeof parsed.distanceKm === 'number' ? Math.round(parsed.distanceKm * 100) / 100 : null,
      visionRaw: parsed.rawText ?? null,
      visionConfidence: parsed.confidence ?? 'failed',
      recordedDate: parsed.recordedDate ?? null,
    };
  } catch (err) {
    console.error('Vision API error:', err);
    return { distanceKm: null, visionRaw: null, visionConfidence: 'failed', recordedDate: null };
  }
}
