# 🍕 Food Delivery Polyglot Persistence Backend

A robust Node.js & Express backend demonstrating **Polyglot Persistence** in a modern food delivery architecture. By matching specialized databases to specific data workloads, this service achieves optimal performance, scalability, and data integrity:

| Workload | Database | Layer / Driver | Key Characteristics |
| :--- | :--- | :--- | :--- |
| **Users & Wallets** | **PostgreSQL** | Prisma ORM | Relational consistency, strict schemas, ACID compliance for balances |
| **Restaurant Catalog** | **MongoDB** | Mongoose | Flexible document model for arbitrary nested item customizations |
| **Live Driver Tracking** | **Redis** | `redis` npm package | High-frequency in-memory caching with automatic 60-second TTL expiration |

---

## 🏗️ Architecture & Data Modeling

```
                            ┌─────────────────────────────────────────┐
                            │          Express.js Backend             │
                            │              (Port 3000)                │
                            └────┬──────────────┬──────────────┬──────┘
                                 │              │              │
                    Prisma Client│      Mongoose│  Redis Client│
                                 ▼              ▼              ▼
                     ┌───────────────┐  ┌───────────────┐  ┌───────────────┐
                     │  PostgreSQL   │  │    MongoDB    │  │     Redis     │
                     │  (Port 5432)  │  │ (Port 27017)  │  │  (Port 6379)  │
                     └───────────────┘  └───────────────┘  └───────────────┘
                      Users & Wallets    Menu & Options     Driver Live GPS
                      (Strict Schema)    (Flexible BSON)     (TTL 60 secs)
```

1. **PostgreSQL (Prisma ORM)**
   - Strict relational schema with `id`, `name`, `email` (unique), and `walletBalance` (Float).
   - Atomic wallet increments (`walletBalance: { increment: amount }`) ensuring financial accuracy.

2. **MongoDB (Mongoose)**
   - Dynamic document model with `restaurantName`, `itemName`, `basePrice`, and a flexible `customizations` array (`Schema.Types.Mixed`).
   - Accommodates differing menu structures without requiring database migrations (e.g., pizza crust choices vs. drink sizes vs. burger toppings).

3. **Redis (`redis` client)**
   - Stores real-time GPS coordinates using key format `driver:{id}:location`.
   - In-memory key with a strict **60-second TTL** (`EX: 60`), automatically expiring stale driver locations.

---

## 📁 Project Structure

```
.
├── docker-compose.yml          # Container configuration for Postgres, Mongo, and Redis
├── prisma/
│   └── schema.prisma           # Prisma schema for PostgreSQL User model
├── src/
│   ├── config/
│   │   ├── prisma.js           # Prisma client singleton & connection lifecycle
│   │   ├── mongoose.js         # Mongoose connection manager
│   │   └── redis.js            # Redis client singleton & event handling
│   ├── models/
│   │   └── menuItem.model.js   # Flexible Mongoose MenuItem schema
│   ├── controllers/
│   │   ├── user.controller.js  # User registration & wallet fund operations
│   │   ├── menu.controller.js  # Menu item catalog operations
│   │   └── driver.controller.js# Real-time driver GPS tracking with TTL
│   ├── routes/
│   │   ├── user.routes.js      # /api/users routes
│   │   ├── menu.routes.js      # /api/menu routes
│   │   ├── driver.routes.js    # /api/driver routes
│   │   └── index.js            # Aggregated API router + /api/health
│   ├── middleware/
│   │   └── errorHandler.js     # Centralized error handler & 404 handler
│   ├── app.js                  # Express middleware setup
│   └── server.js               # Application bootstrap & graceful shutdown
├── .env.example                # Template for environment configuration
├── .env                        # Local development environment configuration
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or later)
- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/)

---

### Step 1: Install Dependencies

```bash
npm install
```

---

### Step 2: Configure Environment Variables

A default `.env` file is included. You can create your own from `.env.example`:

```bash
cp .env.example .env
```

Contents of `.env`:
```env
PORT=3000
NODE_ENV=development

# PostgreSQL (Prisma)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/food_delivery?schema=public"

# MongoDB (Mongoose)
MONGODB_URI="mongodb://localhost:27017/food_delivery"

# Redis
REDIS_URL="redis://localhost:6379"
```

---

### Step 3: Start the Databases Using Docker Compose

Launch PostgreSQL, MongoDB, and Redis in isolated containers:

```bash
docker compose up -d
```

Verify that all three database containers are running and healthy:

```bash
docker compose ps
```

Expected output:
```
NAME                      IMAGE                STATUS
food_delivery_postgres    postgres:16-alpine   Up (healthy)
food_delivery_mongo       mongo:7.0            Up (healthy)
food_delivery_redis       redis:7-alpine       Up (healthy)
```

> **Note on Port Conflicts**: If you already have PostgreSQL (5432) or Redis (6379) running locally on your machine, you can change the host port in `.env` (e.g., `POSTGRES_PORT=5433`, `REDIS_PORT=6380`) and adjust the `DATABASE_URL` / `REDIS_URL` accordingly before running `docker compose up -d`.

---

### Step 4: Push the PostgreSQL Schema with Prisma

Generate the Prisma client and sync the schema to PostgreSQL:

```bash
# Push the User schema directly to the database
npm run prisma:push

# (Optional) Generate the Prisma client if modified
npm run prisma:generate
```

---

### Step 5: Start the Express Application

**Development mode (with file watcher):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

When started, you should see:
```
🚀 Initializing Polyglot Persistence Backend Services...
✅ PostgreSQL connected successfully via Prisma
✅ MongoDB connected successfully at mongodb://localhost:27017/food_delivery
✅ Redis connected successfully and ready

======================================================
🌐 Server running at http://localhost:3000
🩺 Health check:    http://localhost:3000/api/health
======================================================
```

---

### Step 6: Open the Interactive Showcase Dashboard

Open your browser to:
```
http://localhost:3000
```
This interactive dashboard lets you visually test all 3 databases in real time:
- **PostgreSQL**: Create users, deposit funds with atomic increment, and view the user table.
- **MongoDB**: Switch between pizza, burger, and boba presets to insert flexible nested BSON menu items.
- **Redis**: Broadcast GPS coordinates and watch the live 60-second TTL progress bar countdown second-by-second with key expiration.
- **Console**: Live terminal event log capturing all outgoing API calls.

---

## 📡 API Reference & Testing Guide

### 0. System Health Check
Verify the status of all three underlying databases.

```bash
curl -X GET http://localhost:3000/api/health
```

**Response (`200 OK`):**
```json
{
  "status": "ok",
  "timestamp": "2026-10-20T09:30:00.000Z",
  "databases": {
    "postgres": "connected",
    "mongodb": "connected",
    "redis": "connected"
  }
}
```

---

### 1. PostgreSQL (Users & Wallets)

#### Create a User
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "walletBalance": 50.00
  }'
```

**Response (`201 Created`):**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": 1,
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "walletBalance": 50,
    "createdAt": "2026-10-20T09:30:15.123Z",
    "updatedAt": "2026-10-20T09:30:15.123Z"
  }
}
```

#### Add Funds to User's Wallet
```bash
curl -X POST http://localhost:3000/api/users/1/add-funds \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 25.50
  }'
```

**Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Successfully added $25.50 to user's wallet.",
  "data": {
    "id": 1,
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "walletBalance": 75.5,
    "createdAt": "2026-10-20T09:30:15.123Z",
    "updatedAt": "2026-10-20T09:31:00.456Z"
  }
}
```

#### Fetch User
```bash
curl -X GET http://localhost:3000/api/users/1
```

---

### 2. MongoDB (Restaurant Menu Catalog)

#### Add a Flexible Menu Item
Demonstrates storing deeply nested, flexible customization structures (crusts, toppings, spice levels).

```bash
curl -X POST http://localhost:3000/api/menu \
  -H "Content-Type: application/json" \
  -d '{
    "restaurantName": "Luigi Pizza Bistro",
    "itemName": "Artisan Truffle Pizza",
    "basePrice": 18.99,
    "category": "Pizza",
    "description": "Hand-stretched sourdough with black truffle cream and fior di latte mozzarella.",
    "customizations": [
      {
        "title": "Crust Type",
        "type": "single_choice",
        "required": true,
        "options": [
          { "label": "Classic Neapolitan", "priceModifier": 0.00 },
          { "label": "Gluten-Free", "priceModifier": 3.00 },
          { "label": "Stuffed Crust", "priceModifier": 4.50 }
        ]
      },
      {
        "title": "Extra Toppings",
        "type": "multi_choice",
        "maxLimit": 4,
        "options": [
          { "label": "Wild Mushrooms", "priceModifier": 1.75 },
          { "label": "Prosciutto di Parma", "priceModifier": 3.50 },
          { "label": "Fresh Basil", "priceModifier": 0.50 }
        ]
      },
      {
        "title": "Spice Level",
        "type": "slider",
        "scale": ["Mild", "Medium", "Spicy", "Extra Hot"]
      }
    ]
  }'
```

**Response (`201 Created`):**
```json
{
  "success": true,
  "message": "Menu item created successfully in catalog",
  "data": {
    "_id": "6714ea42c8d2a1b947f68310",
    "restaurantName": "Luigi Pizza Bistro",
    "itemName": "Artisan Truffle Pizza",
    "basePrice": 18.99,
    "category": "Pizza",
    "description": "Hand-stretched sourdough with black truffle cream and fior di latte mozzarella.",
    "customizations": [ ... ],
    "isAvailable": true,
    "createdAt": "2026-10-20T09:32:00.000Z",
    "updatedAt": "2026-10-20T09:32:00.000Z"
  }
}
```

#### List Menu Items
```bash
# Get all items
curl -X GET http://localhost:3000/api/menu

# Filter by restaurant
curl -X GET "http://localhost:3000/api/menu?restaurantName=Luigi%20Pizza%20Bistro"
```

---

### 3. Redis (Live Driver Location Tracking)

#### Update Driver Location (60-second TTL)
```bash
curl -X POST http://localhost:3000/api/driver/driver-42/location \
  -H "Content-Type: application/json" \
  -d '{
    "lat": 37.774929,
    "lng": -122.419416
  }'
```

**Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Driver location updated successfully in Redis",
  "key": "driver:driver-42:location",
  "ttl": 60,
  "data": {
    "driverId": "driver-42",
    "lat": 37.774929,
    "lng": -122.419416,
    "updatedAt": "2026-10-20T09:33:00.123Z"
  }
}
```

#### Retrieve Driver Location
```bash
curl -X GET http://localhost:3000/api/driver/driver-42/location
```

**Response (`200 OK` - within 60s):**
```json
{
  "success": true,
  "key": "driver:driver-42:location",
  "ttlRemainingSeconds": 54,
  "data": {
    "driverId": "driver-42",
    "lat": 37.774929,
    "lng": -122.419416,
    "updatedAt": "2026-10-20T09:33:00.123Z"
  }
}
```

**Response (`404 Not Found` - after 60s expires):**
```json
{
  "success": false,
  "error": "Not Found",
  "message": "Location for driver 'driver-42' not found or has expired (TTL exceeded 60s)."
}
```

---

## 🛠️ Direct Database Inspection Tools

### 1. Prisma Studio (PostgreSQL GUI)
Open an interactive browser interface to view and edit PostgreSQL data:
```bash
npm run prisma:studio
```
Access at `http://localhost:5555`.

### 2. MongoDB Shell (`mongosh`)
Connect directly to the MongoDB container:
```bash
docker exec -it food_delivery_mongo mongosh food_delivery
```
Query menu items:
```javascript
db.menuitems.find().pretty();
```

### 3. Redis CLI
Inspect keys and TTLs in Redis:
```bash
docker exec -it food_delivery_redis redis-cli
```
Helpful commands:
```bash
KEYS driver:*
GET driver:driver-42:location
TTL driver:driver-42:location
```

---

## 🛑 Stopping the Infrastructure

To stop the database containers:
```bash
docker compose down
```

To stop containers and wipe persistent database volumes:
```bash
docker compose down -v
```
