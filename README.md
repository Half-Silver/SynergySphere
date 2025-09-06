# SynergySphere

A modern project management and collaboration platform built with React, TypeScript, Node.js, and PostgreSQL.

## Project Structure

```
synergysphere/
├── backend/               # Backend API server
│   ├── src/              # Source code
│   ├── prisma/           # Database schema and migrations
│   ├── .env.example      # Example environment variables
│   └── package.json      # Backend dependencies
│
├── synergysphere/        # Frontend React application
│   ├── src/             # Source code
│   ├── public/          # Static files
│   ├── .env             # Frontend environment variables
│   └── package.json     # Frontend dependencies
│
├── setup.sh             # Setup script
└── README.md            # This file
```

## Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher) or yarn
- PostgreSQL

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd project_SynergySphere
   ```

2. **Run the setup script**
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```
   This will:
   - Install frontend and backend dependencies
   - Set up environment variables
   - Set up the database
   - Generate Prisma client

3. **Start the development servers**
   - Backend:
     ```bash
     cd backend
     npm run dev
     ```
   - Frontend (in a new terminal):
     ```bash
     cd synergysphere
     npm run dev
     ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Prisma Studio (for database management): http://localhost:5555

## Development

### Backend

- **Directory Structure**:
  - `src/controllers/` - Request handlers
  - `src/routes/` - API routes
  - `src/middleware/` - Express middleware
  - `src/services/` - Business logic
  - `src/types/` - TypeScript type definitions

- **Available Scripts**:
  - `npm run dev` - Start development server with hot-reload
  - `npm run build` - Build for production
  - `npm start` - Start production server
  - `npm run prisma:generate` - Generate Prisma client
  - `npm run prisma:migrate` - Run database migrations
  - `npm run prisma:studio` - Open Prisma Studio

### Frontend

- **Built with**:
  - React 18
  - TypeScript
  - Vite
  - Tailwind CSS
  - React Query
  - React Router

- **Available Scripts**:
  - `npm run dev` - Start development server
  - `npm run build` - Build for production
  - `npm run preview` - Preview production build
  - `npm run lint` - Run ESLint

## Deployment

### Backend

1. Set up a PostgreSQL database
2. Configure environment variables in `.env`
3. Build and start the server:
   ```bash
   npm install
   npm run build
   npm start
   ```

### Frontend

1. Update `VITE_API_BASE_URL` in `.env` to point to your backend
2. Build for production:
   ```bash
   npm install
   npm run build
   ```
3. Deploy the `dist` folder to your hosting service

## License

MIT
