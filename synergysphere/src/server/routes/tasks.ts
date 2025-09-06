import { Router } from 'express';
import { 
  getTasks, 
  getTask, 
  createTask, 
  updateTask, 
  deleteTask,
  getMyTasks
} from '../controllers/taskController';
import { protect } from '../middleware/auth';

const router = Router();

// All routes are protected and require authentication
router.use(protect);

// Get tasks for the authenticated user
router.get('/my-tasks', getMyTasks);

// Project tasks routes
router.route('/')
  .get(getTasks)
  .post(createTask);

router.route('/:id')
  .get(getTask)
  .put(updateTask)
  .delete(deleteTask);

export default router;
