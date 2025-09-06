import { Request, Response, NextFunction } from 'express';
import { prisma } from '../index';
import { ApiError } from '../middleware/errorHandler';

export const getTasks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId, status } = req.query;
    
    // Check if project exists and user has access
    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId as string },
        include: { members: true },
      });

      if (!project) {
        return next(new ApiError(404, `Project not found with id of ${projectId}`));
      }

      // Check if user has access to this project
      if (project.managerId !== req.user.id && !project.members.some((m: any) => m.id === req.user.id)) {
        return next(new ApiError(403, 'Not authorized to access tasks for this project'));
      }
    }

    // Build query
    const query: any = {
      where: {},
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    };

    // Filter by project if provided
    if (projectId) {
      query.where.projectId = projectId;
    }

    // Filter by status if provided
    if (status) {
      query.where.status = status;
    }

    const tasks = await prisma.task.findMany(query);

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyTasks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query;

    // Build query
    const query: any = {
      where: {
        OR: [
          { assigneeId: req.user.id },
          { project: { managerId: req.user.id } },
        ],
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    };

    // Filter by status if provided
    if (status) {
      query.where.status = status;
    }

    const tasks = await prisma.task.findMany(query);

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
};

export const getTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: {
        project: {
          include: {
            manager: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            members: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!task) {
      return next(new ApiError(404, `Task not found with id of ${req.params.id}`));
    }

    // Check if user has access to this task's project
    if (
      task.project.managerId !== req.user.id &&
      !task.project.members.some((m: any) => m.id === req.user.id)
    ) {
      return next(new ApiError(403, 'Not authorized to access this task'));
    }

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

export const createTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, status, projectId, assigneeId, deadline } = req.body;

    // Check if project exists and user has access
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true },
    });

    if (!project) {
      return next(new ApiError(404, `Project not found with id of ${projectId}`));
    }

    // Check if user has access to this project
    if (project.managerId !== req.user.id && !project.members.some((m: any) => m.id === req.user.id)) {
      return next(new ApiError(403, 'Not authorized to create tasks for this project'));
    }

    // Check if assignee is a member of the project
    if (assigneeId && !project.members.some((m: any) => m.id === assigneeId) && project.managerId !== assigneeId) {
      return next(new ApiError(400, 'Assignee must be a member of the project'));
    }

    // Create task
    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || 'TODO',
        projectId,
        assigneeId: assigneeId || null,
        deadline: deadline ? new Date(deadline) : null,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, status, assigneeId, deadline } = req.body;

    // Find the task
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: {
        project: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!task) {
      return next(new ApiError(404, `Task not found with id of ${req.params.id}`));
    }

    // Check if user has access to this task's project
    if (
      task.project.managerId !== req.user.id &&
      !task.project.members.some((m: any) => m.id === req.user.id)
    ) {
      return next(new ApiError(403, 'Not authorized to update this task'));
    }

    // Check if assignee is a member of the project if being updated
    if (
      assigneeId &&
      !task.project.members.some((m: any) => m.id === assigneeId) &&
      task.project.managerId !== assigneeId
    ) {
      return next(new ApiError(400, 'Assignee must be a member of the project'));
    }

    // Update task
    const updatedTask = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(status && { status }),
        ...(assigneeId !== undefined && { assigneeId: assigneeId || null }),
        ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: updatedTask,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Find the task
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: {
        project: true,
      },
    });

    if (!task) {
      return next(new ApiError(404, `Task not found with id of ${req.params.id}`));
    }

    // Check if user is the project manager
    if (task.project.managerId !== req.user.id) {
      return next(new ApiError(403, 'Not authorized to delete this task'));
    }

    // Delete the task
    await prisma.task.delete({
      where: { id: req.params.id },
    });

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};
