import { Ratelimit } from '@upstash/ratelimit';
import redis from '../config/redis';
import { Request, Response, NextFunction } from 'express';

const loginLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 requests per minute
  analytics: true,
});

const signupLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '1 h'), // 3 signups per hour per IP
  analytics: true,
});

export const rateLimitLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const ip = req.ip || req.socket.remoteAddress || '';
  const { success } = await loginLimiter.limit(ip);

  if (!success) {
    res.status(429).json({ error: 'Too many login attempts. Please try again later.' });
    return;
  }

  next();
};

export const rateLimitSignup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const ip = req.ip || req.socket.remoteAddress || '';
  const { success } = await signupLimiter.limit(ip);

  if (!success) {
    res.status(429).json({ error: 'Too many signup attempts. Please try again later.' });
    return;
  }

  next();
};