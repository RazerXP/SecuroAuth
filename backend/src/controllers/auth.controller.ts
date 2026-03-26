import { Request, Response, CookieOptions } from 'express';
import { AuthService } from '../services/auth.service.js';
import { verifyToken, JWTPayload } from '../utils/jwt.js';

const isProduction = process.env.NODE_ENV === 'production';
const accessTokenCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax',
  maxAge: 15 * 60 * 1000,
  path: '/',
};

const refreshTokenCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};

const clearCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax',
  path: '/',
};

const setAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
  res.cookie('accessToken', accessToken, accessTokenCookieOptions);
  res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions);
};

const clearAuthCookies = (res: Response) => {
  res.clearCookie('accessToken', clearCookieOptions);
  res.clearCookie('refreshToken', clearCookieOptions);
};

export class AuthController {
  static async signup(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
      }

      const result = await AuthService.signup(email, password);
      setAuthCookies(res, result.accessToken, result.refreshToken);
      res.status(201).json({ user: result.user });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
      }

      const result = await AuthService.login(email, password);
      setAuthCookies(res, result.accessToken, result.refreshToken);
      res.status(200).json({ user: result.user });
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  }

  static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies?.refreshToken as string | undefined;

      if (!refreshToken) {
        res.status(400).json({ error: 'Refresh token required' });
        return;
      }

      const decoded = verifyToken<JWTPayload>(refreshToken);
      const result = await AuthService.refreshToken(decoded.userId, refreshToken);
      setAuthCookies(res, result.accessToken, result.refreshToken);
      res.status(200).json({ message: 'Token refreshed' });
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  }

  static async logout(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies?.refreshToken as string | undefined;

      if (refreshToken) {
        try {
          const decoded = verifyToken<JWTPayload>(refreshToken);
          await AuthService.logout(decoded.userId);
        } catch {
          // Always clear cookies even when refresh token is invalid/expired.
        }
      }

      clearAuthCookies(res);
      res.status(200).json({ message: 'Logged out successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getMe(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(400).json({ error: 'User not authenticated' });
        return;
      }

      const user = await AuthService.getUserById(userId);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.status(200).json({
        user: {
          id: user._id.toString(),
          email: user.email,
          createdAt: user.createdAt,
        },
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}