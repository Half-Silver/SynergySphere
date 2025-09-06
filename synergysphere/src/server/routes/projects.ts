import { Router } from 'express';
import { 
  getProjects, 
  getProject, 
  createProject, 
  updateProject, 
  deleteProject,
  addProjectMember,
  removeProjectMember
} from '../controllers/projectController';
import { protect } from '../middleware/auth';

const router = Router();

// All routes are protected and require authentication
router.use(protect);

// Project routes
router.route('/')
  .get(getProjects)
  .post(createProject);

router.route('/:id')
  .get(getProject)
  .put(updateProject)
  .delete(deleteProject);

// Project member routes
router.route('/:id/members')
  .post(addProjectMember);

router.route('/:id/members/:userId')
  .delete(removeProjectMember);

export default router;
