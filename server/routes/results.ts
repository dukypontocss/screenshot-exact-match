import { Router } from 'express';
import {
  getResultsForClients,
  getResultById,
  createOrUpdateResult,
  deleteResult,
} from '../controllers/resultController.js';

const router = Router();

router.get('/', getResultsForClients);
router.get('/:id', getResultById);
router.post('/', createOrUpdateResult);
router.put('/:id', createOrUpdateResult);
router.delete('/:id', deleteResult);

export default router;