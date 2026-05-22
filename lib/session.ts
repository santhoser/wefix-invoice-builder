import { SessionOptions } from 'iron-session';

export interface SessionData {
  user?: {
    username: string;
    isLoggedIn: boolean;
  };
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || 'wefix-invoice-builder-secret-key-32chars!!',
  cookieName: 'wefix_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 8, // 8 hours
  },
};
