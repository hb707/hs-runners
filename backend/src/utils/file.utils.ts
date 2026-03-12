import fs from 'fs/promises';
import path from 'path';

const locks = new Map<string, Promise<void>>();

async function withLock<T>(filePath: string, fn: () => Promise<T>): Promise<T> {
  const existing = locks.get(filePath) ?? Promise.resolve();
  let releaseLock!: () => void;
  const nextLock = new Promise<void>((resolve) => { releaseLock = resolve; });
  locks.set(filePath, existing.then(() => nextLock));

  await existing;
  try {
    return await fn();
  } finally {
    releaseLock();
    if (locks.get(filePath) === nextLock) {
      locks.delete(filePath);
    }
  }
}

export async function readJsonFile<T>(filePath: string, defaultValue: T): Promise<T> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return defaultValue;
    }
    throw err;
  }
}

export async function writeJsonFile<T>(filePath: string, data: T): Promise<void> {
  return withLock(filePath, async () => {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    const tmpPath = `${filePath}.tmp`;
    await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
    await fs.rename(tmpPath, filePath);
  });
}

export async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}
