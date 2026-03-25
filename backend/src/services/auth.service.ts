import { User, IUser } from '../models/user.model';
import { hashPassword, comparePassword } from '../utils/hash';
import { generateAccessToken, generateRefreshToken, JWTPayload } from '../utils/jwt';
import { TokenService } from './token.service';

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

    const accessToken = generateAccessToken(payload);
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

    const accessToken = generateAccessToken(payload);
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

  static async refreshToken(userId: string, refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
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

    const accessToken = generateAccessToken(payload);

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
}