import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const REFRESH_TOKEN_EXPIRY = '7d';
const ACCESS_TOKEN_EXPIRY_SECONDS = 15 * 60;
const ACCESS_TOKEN_ROTATE_AFTER_SECONDS = 10 * 60;
const ACCESS_TOKEN_HARD_MAX_SECONDS = 24 * 60 * 60;

export interface JWTPayload{
  userId: string;
  email: string;
}

export interface AccessTokenPayload extends JWTPayload {
  accessMaxExp: number;
  iat?: number;
  exp?: number;
}

interface AccessTokenOptions {
  accessMaxExp?: number;
}

export const getAccessTokenHardMaxExp = (): number => {
  return Math.floor(Date.now() / 1000) + ACCESS_TOKEN_HARD_MAX_SECONDS;
};

export const generateAccessToken = (payload: JWTPayload, options: AccessTokenOptions = {}): string => {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const accessMaxExp = options.accessMaxExp ?? getAccessTokenHardMaxExp();
  const remainingLifetimeSeconds = accessMaxExp - nowSeconds;

  if (remainingLifetimeSeconds <= 0) {
    throw new Error('Access token hard max lifetime reached');
  }

  const expiresInSeconds = Math.min(ACCESS_TOKEN_EXPIRY_SECONDS, remainingLifetimeSeconds);

  return jwt.sign(
    {
      ...payload,
      accessMaxExp,
    },
    JWT_SECRET,
    { expiresIn: expiresInSeconds }
  );
};

export const generateRefreshToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
};

export const verifyToken = <T = JWTPayload>(token: string): T => {
  return jwt.verify(token, JWT_SECRET) as T;
};

export const shouldRotateAccessToken = (payload: AccessTokenPayload): boolean => {
  if (typeof payload.iat !== 'number') {
    return false;
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const tokenAgeSeconds = nowSeconds - payload.iat;
  const withinHardMax = payload.accessMaxExp > nowSeconds;

  return tokenAgeSeconds > ACCESS_TOKEN_ROTATE_AFTER_SECONDS && withinHardMax;
};