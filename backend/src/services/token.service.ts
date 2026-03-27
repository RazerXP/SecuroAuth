import redis from '../config/redis.js';
import { JWTPayload, verifyToken, generateRefreshToken } from '../utils/jwt.js';

export class TokenService {
  private static getRefreshTokenKey(userId: string): string {
    return `refresh_token:${userId}`;
  }

  private static getResetTokenKey(userId: string): string {
    return `reset_token:${userId}`;
  }

  static async storeRefreshToken(userId: string, token: string): Promise<void> {
    const key = this.getRefreshTokenKey(userId);
    // store for 7d + 1h
    await redis.set(key, token, { ex: 7 * 24 * 60 * 60 + 60 * 60 });
  }

  static async getRefreshToken(userId: string): Promise<string | null> {
    const key = this.getRefreshTokenKey(userId);
    return await redis.get(key);
  }

  static async deleteRefreshToken(userId: string): Promise<void> {
    const key = this.getRefreshTokenKey(userId);
    await redis.del(key);
  }

  static async storeResetToken(userId: string, token: string): Promise<void> {
    const key = this.getResetTokenKey(token);
    await redis.set(key, userId, { ex: 15 * 60 }); // 15 minutes
  }

  static async getAndDeleteResetToken(token: string): Promise<string | null> {
    const key = this.getResetTokenKey(token);
    const userId = await redis.get(key) as string | null;
    await redis.del(key);
    return userId;
  }

  static async validateAndRotateRefreshToken(userId: string, providedToken: string): Promise<string | null> {
    const storedToken = await this.getRefreshToken(userId);
    if (!storedToken || storedToken !== providedToken) {
      return null;
    }

    let decoded: JWTPayload;
    try {
      decoded = verifyToken(providedToken);
    } catch {
      return null;
    }

    if (decoded.userId !== userId) {
      return null;
    }

    // overwrite with new token
    const newRefreshToken = generateRefreshToken({
      userId: decoded.userId,
      email: decoded.email,
    });

    await this.storeRefreshToken(userId, newRefreshToken);
    return newRefreshToken;
  }

  static async invalidateUserToken(userId: string): Promise<void> {
    await this.deleteRefreshToken(userId);
  }
}