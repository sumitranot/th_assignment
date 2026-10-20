import { authService } from './auth.service.js';

/**
 * Controller handling authentication endpoints.
 */
export class AuthController {
  /**
   * Handles user login request.
   */
  async login(req, res, next) {
    try {
      const { username, password } = req.body;
      const result = await authService.login({ username, password });
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handles getting current user profile.
   */
  async getMe(req, res, next) {
    try {
      const user = await authService.getCurrentUser(req.user.id);
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
