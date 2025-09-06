import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { PORT, NODE_ENV, CORS_OPTIONS } from './config';
import { prisma } from './lib/prisma';
import authRoutes from './routes/auth.routes';
import projectRoutes from './routes/project.routes';
import taskRoutes from './routes/task.routes';
import { errorHandler, notFound } from './middleware/error.middleware';

// Initialize Express app
const app = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors(CORS_OPTIONS)); // CORS with options
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Logging in development
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Database health endpoint
app.get('/api/db/health', async (req: Request, res: Response) => {
  try {
    // Minimal query to validate the DB connection
    await prisma.$queryRawUnsafe('SELECT 1');
    res.status(200).json({ status: 'ok', database: 'connected' });
  } catch (err) {
    console.error('DB health check failed:', err);
    res.status(500).json({ status: 'error', database: 'unreachable' });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);

// 404 handler
app.use(notFound);

// Error handling middleware
app.use(errorHandler);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('Unhandled Rejection:', err);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server running in ${NODE_ENV} mode on port ${PORT}`);
});

// Handle shutdown
const shutdown = async () => {
  console.log('Shutting down server...');
  
  // Close the HTTP server
  server.close(async () => {
    console.log('Server closed');
    
    // Close database connection
    await prisma.$disconnect();
    console.log('Database connection closed');
    
    process.exit(0);
  });
};

// Handle signals
type Signal = 'SIGTERM' | 'SIGINT';
const signals: Signal[] = ['SIGTERM', 'SIGINT'];
signals.forEach((signal) => {
  process.on(signal, () => {
    console.log(`${signal} received`);
    shutdown();
  });
});
