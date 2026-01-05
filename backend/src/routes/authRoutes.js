import express from 'express';
import { login, bootstrapOwner } from '../controllers/authController.js';

const router = express.Router();

router.post('/login', login);
router.post('/bootstrap-owner', bootstrapOwner);

export default router;