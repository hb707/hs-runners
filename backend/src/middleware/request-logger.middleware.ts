import type { Request, Response, NextFunction } from 'express';

function sanitizeBody(body: unknown): unknown {
  if (!body || typeof body !== 'object') return body;
  const sensitive = ['password', 'token', 'accessToken', 'refreshToken'];
  return Object.fromEntries(
    Object.entries(body as Record<string, unknown>).map(([k, v]) =>
      sensitive.includes(k) ? [k, '***'] : [k, v]
    )
  );
}

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const { method, path, query, body } = req;

  const sanitizedBody = sanitizeBody(body);
  console.log(`→ ${method} ${path}`, {
    ...(Object.keys(query).length ? { query } : {}),
    ...(sanitizedBody && Object.keys(sanitizedBody as object).length ? { body: sanitizedBody } : {}),
  });

  res.on('finish', () => {
    const ms = Date.now() - start;
    const level = res.statusCode >= 400 ? 'ERROR' : 'OK';
    console.log(`← ${method} ${path} [${res.statusCode}] ${ms}ms [${level}]`);
  });

  next();
}
