import { Router } from 'express';
import { 
  createTask, 
  getTasks, 
  getTask, 
  updateTask, 
  deleteTask,
  assignTask,
  updateTaskStatus,
  addTaskComment,
  getTaskComments
} from '../controllers/task.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Task routes
router.route('/')
  .get(getTasks)
  .post(createTask);

router.route('/:id')
  .get(getTask)
  .put(updateTask)
  .delete(deleteTask);

// Task assignment and status
router.put('/:id/assign', assignTask);
router.put('/:id/status', updateTaskStatus);

// Task comments
router.route('/:taskId/comments')
  .get(getTaskComments)
  .post(addTaskComment);

export default router;
