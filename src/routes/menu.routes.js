import { Router } from 'express';
import {
  addMenuItem,
  getMenuItems,
  getMenuItemById,
} from '../controllers/menu.controller.js';

const router = Router();

// POST /api/menu - Add menu item with flexible customizations
// GET /api/menu - Retrieve menu items (supports query filters)
router.route('/')
  .post(addMenuItem)
  .get(getMenuItems);

// GET /api/menu/:id - Retrieve single menu item
router.route('/:id')
  .get(getMenuItemById);

export default router;
