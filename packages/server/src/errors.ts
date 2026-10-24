import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  if (err instanceof ZodError) {
    // Our own messages are in Russian; zod's built-in ones are English and stay generic.
    const custom = err.issues.find((i) => /[а-яё]/i.test(i.message));
    return res.status(400).json({ error: custom?.message ?? 'Некорректные данные', details: err.flatten().fieldErrors });
  }
  // body-parser and static-file errors carry their own status.
  const e = err as { status?: number; type?: string };
  if (e.type === 'entity.too.large') return res.status(413).json({ error: 'Файл слишком большой' });
  if (e.status === 404) return res.status(404).json({ error: 'Файл не найден' });
  if (e.status === 400) return res.status(400).json({ error: 'Некорректные данные' });
  console.error(err);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
}
