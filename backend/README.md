# SynergySphere Backend

This is the backend service for the SynergySphere application, built with Node.js, Express, and Prisma.

## Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher) or yarn
- PostgreSQL database

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Update the database connection string and other variables as needed

3. Set up the database:
   ```bash
   npx prisma migrate dev --name init
   ```

4. Generate Prisma Client:
   ```bash
   npx prisma generate
   ```

## Development

To run the development server:

```bash
npm run dev
```

The server will be available at `http://localhost:5000`

## API Documentation

API documentation is available at `/api-docs` when running in development mode.

## Testing

To run tests:

```bash
npm test
```

## Production

To build for production:

```bash
npm run build
npm start
```
