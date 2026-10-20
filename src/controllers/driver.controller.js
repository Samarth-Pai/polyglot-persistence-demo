import redisClient from '../config/redis.js';

const DRIVER_LOCATION_TTL_SECONDS = 60;

/**
 * @desc    Update driver's real-time geographic coordinates in Redis with TTL
 * @route   POST /api/driver/:id/location
 */
export async function updateDriverLocation(req, res, next) {
  try {
    const { id } = req.params;
    const { lat, lng } = req.body;

    if (!id || id.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Driver ID is required.',
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || latitude < -90 || latitude > 90) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'lat must be a valid latitude number between -90 and 90.',
      });
    }

    if (isNaN(longitude) || longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'lng must be a valid longitude number between -180 and 180.',
      });
    }

    const key = `driver:${id}:location`;
    const locationPayload = {
      driverId: id,
      lat: latitude,
      lng: longitude,
      updatedAt: new Date().toISOString(),
    };

    // Store in Redis with 60-second TTL
    await redisClient.set(key, JSON.stringify(locationPayload), {
      EX: DRIVER_LOCATION_TTL_SECONDS,
    });

    return res.status(200).json({
      success: true,
      message: 'Driver location updated successfully in Redis',
      key,
      ttl: DRIVER_LOCATION_TTL_SECONDS,
      data: locationPayload,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * @desc    Get driver's current real-time coordinates from Redis
 * @route   GET /api/driver/:id/location
 */
export async function getDriverLocation(req, res, next) {
  try {
    const { id } = req.params;

    if (!id || id.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Driver ID is required.',
      });
    }

    const key = `driver:${id}:location`;

    // Fetch value and TTL concurrently from Redis
    const [rawLocation, ttlRemaining] = await Promise.all([
      redisClient.get(key),
      redisClient.ttl(key),
    ]);

    if (!rawLocation) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Location for driver '${id}' not found or has expired (TTL exceeded ${DRIVER_LOCATION_TTL_SECONDS}s).`,
      });
    }

    const parsedLocation = JSON.parse(rawLocation);

    return res.status(200).json({
      success: true,
      key,
      ttlRemainingSeconds: ttlRemaining,
      data: parsedLocation,
    });
  } catch (error) {
    return next(error);
  }
}
