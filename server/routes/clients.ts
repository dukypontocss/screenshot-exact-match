import { Router } from 'express';
import {
  getAllClients,
  getClientsByManager,
  getClientById,
  createClient,
  updateClient,
  archiveClient,
} from '../controllers/clientController.js';

const router = Router();

router.get('/', getAllClients);
router.get('/manager/:managerId', getClientsByManager);
router.get('/:id', getClientById);
router.post('/', createClient);
router.put('/:id', updateClient);
router.patch('/:id/archive', archiveClient);

export default router;