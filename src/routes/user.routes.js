import { Router } from 'express';
import {
  createUser,
  addFunds,
  getUserById,
  getAllUsers,
} from '../controllers/user.controller.js';

const router = Router();

// POST /api/users - Create user
// GET /api/users - List users
router.route('/')
  .post(createUser)
  .get(getAllUsers);

// POST /api/users/:id/add-funds - Add funds to user wallet
// GET /api/users/:id - Get user by ID
router.route('/:id/add-funds')
  .post(addFunds);

router.route('/:id')
  .get(getUserById);

export default router;
