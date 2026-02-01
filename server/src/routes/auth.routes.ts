import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate, registerSchema, loginSchema } from '../utils/validation';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', authController.refreshAccessToken);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.me);

export default router;
