import { Response } from 'express';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';
import { parseTokenExpiry } from '../utils/token';

const SALT_ROUNDS = 10;
const MAX_REFRESH_TOKENS_PER_USER = 5;

// JWT configuration with proper typing
const getAccessTokenOptions = (): SignOptions => ({
  expiresIn: (process.env.JWT_EXPIRES_IN || '1h') as any
});

const getRefreshTokenOptions = (): SignOptions => ({
  expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as any
});

if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
  throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be set in environment variables');
}

export const register = async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const existingUser = await db('users').where({ email }).first();
    if (existingUser) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const [user] = await db('users')
      .insert({
        id: uuidv4(),
        email,
        password_hash: passwordHash,
        first_name: firstName,
        last_name: lastName,
        role: 'user',
        company_id: null,
        site_id: null,
        department_id: null,
        is_active: true
      })
      .returning(['id', 'email', 'first_name', 'last_name', 'role', 'company_id', 'site_id', 'department_id']);

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      getAccessTokenOptions()
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET!,
      getRefreshTokenOptions()
    );

    const refreshExpiryMs = parseTokenExpiry(process.env.JWT_REFRESH_EXPIRES_IN || '7d');
    const expiresAt = new Date(Date.now() + refreshExpiryMs);

    await db('refresh_tokens').insert({
      id: uuidv4(),
      user_id: user.id,
      token: refreshToken,
      expires_at: expiresAt
    });

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        companyId: user.company_id,
        siteId: user.site_id,
        departmentId: user.department_id
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
};

export const login = async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await db('users').where({ email, is_active: true }).first();
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const existingTokens = await db('refresh_tokens')
      .where({ user_id: user.id })
      .where('expires_at', '>', new Date())
      .orderBy('created_at', 'desc');

    if (existingTokens.length >= MAX_REFRESH_TOKENS_PER_USER) {
      const tokensToDelete = existingTokens.slice(MAX_REFRESH_TOKENS_PER_USER - 1);
      await db('refresh_tokens')
        .whereIn('id', tokensToDelete.map(t => t.id))
        .delete();
    }

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      getAccessTokenOptions()
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET!,
      getRefreshTokenOptions()
    );

    const refreshExpiryMs = parseTokenExpiry(process.env.JWT_REFRESH_EXPIRES_IN || '7d');
    const expiresAt = new Date(Date.now() + refreshExpiryMs);

    await db('refresh_tokens').insert({
      id: uuidv4(),
      user_id: user.id,
      token: refreshToken,
      expires_at: expiresAt
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        companyId: user.company_id,
        siteId: user.site_id,
        departmentId: user.department_id
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
};

export const refreshAccessToken = async (req: AuthRequest, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!);
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Refresh token expired' });
      }
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const tokenRecord = await db('refresh_tokens')
      .where({ token: refreshToken, user_id: decoded.userId })
      .where('expires_at', '>', new Date())
      .first();

    if (!tokenRecord) {
      return res.status(401).json({ error: 'Refresh token not found or expired' });
    }

    const user = await db('users').where({ id: decoded.userId, is_active: true }).first();

    if (!user) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      getAccessTokenOptions()
    );

    res.json({ accessToken });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
};

export const logout = async (req: AuthRequest, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await db('refresh_tokens').where({ token: refreshToken }).delete();
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Failed to logout' });
  }
};

export const me = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await db('users')
      .where({ id: req.user.id })
      .select('id', 'email', 'first_name', 'last_name', 'role', 'company_id', 'site_id', 'department_id')
      .first();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      companyId: user.company_id,
      siteId: user.site_id,
      departmentId: user.department_id
    });
  } catch (error) {
    console.error('Me error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
};
