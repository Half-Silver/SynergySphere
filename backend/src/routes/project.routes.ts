import { Router } from 'express';
import { 
  createProject, 
  getProjects, 
  getProject, 
  updateProject, 
  deleteProject,
  addProjectMember,
  removeProjectMember,
  updateProjectMemberRole
} from '../controllers/project.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Project routes
router.route('/')
  .get(getProjects)
  .post(createProject);

router.route('/:id')
  .get(getProject)
  .put(updateProject)
  .delete(deleteProject);

// Project member routes
router.route('/:projectId/members')
  .post(addProjectMember);

router.route('/:projectId/members/:userId')
  .put(updateProjectMemberRole)
  .delete(removeProjectMember);

export default router;
