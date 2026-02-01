import { Router } from 'express';
import * as siteController from '../controllers/site.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticate, siteController.listSites);
router.get('/:id', authenticate, siteController.getSite);
router.post('/', authenticate, authorize('super_admin', 'company_admin'), siteController.createSite);
router.put('/:id', authenticate, authorize('super_admin', 'company_admin', 'site_admin'), siteController.updateSite);
router.delete('/:id', authenticate, authorize('super_admin', 'company_admin'), siteController.deleteSite);

export default router;
