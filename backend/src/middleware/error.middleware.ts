import type { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message },
    });
    return;
  }

  // Axios error - show actual message in development
  const axiosErr = err as { isAxiosError?: boolean; response?: { data?: { error_description?: string; error?: string }; status?: number } };
  if (axiosErr.isAxiosError) {
    const msg = axiosErr.response?.data?.error_description ?? axiosErr.response?.data?.error ?? 'External API error';
    console.error('Axios error:', msg, axiosErr.response?.data);
    res.status(502).json({
      success: false,
      error: { code: 'EXTERNAL_API_ERROR', message: msg },
    });
    return;
  }

  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
  });
}
