import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { NotFoundError, UnauthorizedError } from '../../lib/errors.js';
import { prisma } from '../../lib/prisma.js';

/**
 * Authentication business logic service.
 */
export class AuthService {
  /**
   * Authenticates a user with username and password.
   * Uses constant-style error messaging to prevent user enumeration.
   *
   * @param {object} params
   * @param {string} params.username
   * @param {string} params.password
   * @returns {Promise<{ token: string, user: { id: string, username: string, name: string, role: string } }>}
   */
  async login({ username, password }) {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const payload = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    };

    const token = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    });

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
    };
  }

  /**
   * Retrieves the current user's profile details.
   *
   * @param {string} userId
   * @returns {Promise<{ id: string, username: string, name: string, role: string }>}
   */
  async getCurrentUser(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }
}

export const authService = new AuthService();
