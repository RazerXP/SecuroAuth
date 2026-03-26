import { Request, Response, NextFunction, CookieOptions } from 'express';
import { verifyToken, JWTPayload, AccessTokenPayload, shouldRotateAccessToken, generateAccessToken } from '../utils/jwt.js';

const isProduction = process.env.NODE_ENV === 'production';
const accessTokenCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax',
  maxAge: 15 * 60 * 1000,
  path: '/',
};

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload & { accessMaxExp?: number };
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.cookies?.accessToken as string | undefined;

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  try {
    const decoded = verifyToken<AccessTokenPayload>(token);
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      accessMaxExp: decoded.accessMaxExp,
    };

    if (shouldRotateAccessToken(decoded)) {
      const refreshedToken = generateAccessToken(
        {
          userId: decoded.userId,
          email: decoded.email,
        },
        {
          accessMaxExp: decoded.accessMaxExp,
        }
      );

      console.log('Rotating access token for user:', decoded.userId);

      res.cookie('accessToken', refreshedToken, accessTokenCookieOptions);
    }

    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};