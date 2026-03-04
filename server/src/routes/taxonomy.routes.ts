import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { listCategories, getCategory } from '../controllers/taxonomy.controller';

const router = Router();

router.get('/categories', authenticate, listCategories);
router.get('/categories/:id', authenticate, getCategory);

export default router;
