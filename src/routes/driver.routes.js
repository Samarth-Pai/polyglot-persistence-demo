import { Router } from 'express';
import {
  updateDriverLocation,
  getDriverLocation,
} from '../controllers/driver.controller.js';

const router = Router();

// POST /api/driver/:id/location - Update real-time GPS location (60s TTL)
// GET /api/driver/:id/location - Retrieve real-time GPS location
router.route('/:id/location')
  .post(updateDriverLocation)
  .get(getDriverLocation);

export default router;
