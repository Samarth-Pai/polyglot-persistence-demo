import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import apiRoutes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Serve static frontend dashboard files
app.use(express.static(path.join(__dirname, '../public')));

// API Overview route
app.get('/api/overview', (req, res) => {
  res.json({
    message: 'Food Delivery Polyglot Persistence API',
    databases: {
      postgreSQL: 'Users & Wallets (via Prisma)',
      mongoDB: 'Restaurant Catalog & Customizations (via Mongoose)',
      redis: 'Live Driver GPS Tracking with TTL (via Redis client)',
    },
    endpoints: {
      health: 'GET /api/health',
      users: {
        create: 'POST /api/users',
        addFunds: 'POST /api/users/:id/add-funds',
        getById: 'GET /api/users/:id',
        list: 'GET /api/users',
      },
      menu: {
        create: 'POST /api/menu',
        list: 'GET /api/menu',
        getById: 'GET /api/menu/:id',
      },
      driver: {
        updateLocation: 'POST /api/driver/:id/location',
        getLocation: 'GET /api/driver/:id/location',
      },
    },
  });
});

// API Routes
app.use('/api', apiRoutes);

// Catch-all 404
app.use(notFoundHandler);

// Error handling
app.use(errorHandler);

export default app;
