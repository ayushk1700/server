import { Router } from 'express';
import * as authController from '../controllers/authController';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/pre-keys/:userId', authController.getPreKeys);
router.post('/pre-keys', authController.uploadPreKeys);

export default router;
