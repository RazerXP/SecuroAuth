import { User, IUser } from '../models/user.model.js';
import { hashPassword, comparePassword } from '../utils/hash.js';
import { generateAccessToken, generateRefreshToken, getAccessTokenHardMaxExp, JWTPayload } from '../utils/jwt.js';
import { TokenService } from './token.service.js';
import crypto from 'crypto';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
  };
}

export class AuthService {
  static async signup(email: string, password: string): Promise<AuthResponse> {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('User already exists');
    }
    const hashedPassword = await hashPassword(password);

    const user = new User({
      email,
      password: hashedPassword,
    });
    await user.save();

    // Tokens
    const payload: JWTPayload = {
      userId: user._id.toString(),
      email: user.email,
    };

    const accessToken = generateAccessToken(payload, { accessMaxExp: getAccessTokenHardMaxExp() });
    const refreshToken = generateRefreshToken(payload);

    await TokenService.storeRefreshToken(user._id.toString(), refreshToken);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id.toString(),
        email: user.email,
      },
    };
  }

  static async login(email: string, password: string): Promise<AuthResponse> {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Tokens
    const payload: JWTPayload = {
      userId: user._id.toString(),
      email: user.email,
    };

    const accessToken = generateAccessToken(payload, { accessMaxExp: getAccessTokenHardMaxExp() });
    const refreshToken = generateRefreshToken(payload);

    await TokenService.storeRefreshToken(user._id.toString(), refreshToken);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id.toString(),
        email: user.email,
      },
    };
  }

  static async refreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const rotatedRefreshToken = await TokenService.validateAndRotateRefreshToken(userId, refreshToken);
    if (!rotatedRefreshToken) {
      throw new Error('Invalid refresh token');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // generating new access token
    const payload: JWTPayload = {
      userId: user._id.toString(),
      email: user.email,
    };

    const accessToken = generateAccessToken(payload, { accessMaxExp: getAccessTokenHardMaxExp() });

    return {
      accessToken,
      refreshToken: rotatedRefreshToken,
    };
  }

  static async logout(userId: string): Promise<void> {
    await TokenService.invalidateUserToken(userId);
  }

  static async getUserById(userId: string): Promise<IUser | null> {
    return await User.findById(userId);
  }

  static async forgotPassword(email: string): Promise<{ resetUrl?: string }> {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return {};
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    await TokenService.storeResetToken(user._id.toString(), tokenHash);

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/?view=reset&token=${rawToken}`;

    return { resetUrl };
  }

  static async resetPassword(token: string, newPassword: string): Promise<void> {
    if (newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const userId = await TokenService.getAndDeleteResetToken(tokenHash);

    if (!userId) {
      throw new Error('Invalid or expired reset token');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.password = await hashPassword(newPassword);
    await user.save();

    await TokenService.invalidateUserToken(user._id.toString());
  }
}