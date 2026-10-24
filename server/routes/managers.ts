import { Router } from 'express';
import {
  getManagers,
  getManagerById,
  createManager,
  updateManager,
  archiveManager,
} from '../controllers/managerController.js';

const router = Router();

router.get('/', getManagers);
router.get('/:id', getManagerById);
router.post('/', createManager);
router.put('/:id', updateManager);
router.patch('/:id/archive', archiveManager);

export default router;