import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/error.middleware';

export const createTask = async (req: Request, res: Response) => {
  try {
    const { title, description, status = 'TODO', priority = 'MEDIUM', dueDate, projectId, assigneeId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    // Check if the user has access to the project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          where: { userId }
        }
      }
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    const isMember = project.members.some(member => member.userId === userId) || project.managerId === userId;
    if (!isMember) {
      throw new AppError('Not authorized to create tasks in this project', 403);
    }

    // Create the task
    const task = await prisma.task.create({
      data: {
        title,
        description,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        project: {
          connect: { id: projectId }
        },
        createdBy: {
          connect: { id: userId }
        },
        ...(assigneeId && {
          assignee: {
            connect: { id: assigneeId }
          }
        })
      },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    throw new AppError('Failed to create task', 500);
  }
};

export const getTasks = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { projectId, status, assigneeId, priority, search } = req.query;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    // Get all projects the user has access to
    const userProjects = await prisma.project.findMany({
      where: {
        OR: [
          { managerId: userId },
          { members: { some: { userId } } }
        ]
      },
      select: { id: true }
    });

    const projectIds = userProjects.map(project => project.id);

    // Build filter
    const filter: any = {
      projectId: { in: projectIds },
      ...(status && { status }),
      ...(priority && { priority }),
      ...(assigneeId && { assigneeId: assigneeId === 'me' ? userId : assigneeId }),
      ...(search && {
        OR: [
          { title: { contains: search as string, mode: 'insensitive' } },
          { description: { contains: search as string, mode: 'insensitive' } }
        ]
      })
    };

    // If a specific project is requested, check if the user has access to it
    if (projectId) {
      if (!projectIds.includes(projectId as string)) {
        throw new AppError('Not authorized to access tasks in this project', 403);
      }
      filter.projectId = projectId;
    }

    const tasks = await prisma.task.findMany({
      where: filter,
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            comments: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw new AppError('Failed to fetch tasks', 500);
  }
};

export const getTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            manager: {
              select: {
                id: true,
                name: true
              }
            },
            members: {
              where: { userId },
              select: { userId: true }
            }
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    // Check if user has access to this task's project
    const isManager = task.project.manager.id === userId;
    const isMember = task.project.members.some(member => member.userId === userId);
    const isAssignee = task.assigneeId === userId;
    const isCreator = task.createdById === userId;

    if (!isManager && !isMember && !isAssignee && !isCreator) {
      throw new AppError('Not authorized to access this task', 403);
    }

    res.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Failed to fetch task' });
  }
};

export const updateTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { title, description, status, priority, dueDate, assigneeId } = req.body;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    // Get the task with project info
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            manager: true,
            members: {
              where: { userId }
            }
          }
        },
        createdBy: true
      }
    });

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    // Check permissions
    const isManager = task.project.managerId === userId;
    const isAdmin = task.project.members.some(member => 
      member.userId === userId && member.role === 'ADMIN'
    );
    const isCreator = task.createdById === userId;
    const isAssignee = task.assigneeId === userId;

    // Only manager, admin, creator, or assignee can update the task
    if (!isManager && !isAdmin && !isCreator && !isAssignee) {
      throw new AppError('Not authorized to update this task', 403);
    }

    // Only manager or admin can change assignee
    if (assigneeId && !isManager && !isAdmin) {
      throw new AppError('Not authorized to change task assignee', 403);
    }

    // Update the task
    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        title,
        description,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        ...(assigneeId && {
          assignee: {
            connect: { id: assigneeId }
          }
        })
      },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    throw new AppError('Failed to update task', 500);
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    // Get the task with project info
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            manager: true,
            members: {
              where: { userId }
            }
          }
        },
        createdBy: true
      }
    });

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    // Check permissions
    const isManager = task.project.managerId === userId;
    const isAdmin = task.project.members.some(member => 
      member.userId === userId && member.role === 'ADMIN'
    );
    const isCreator = task.createdById === userId;

    // Only manager, admin, or creator can delete the task
    if (!isManager && !isAdmin && !isCreator) {
      throw new AppError('Not authorized to delete this task', 403);
    }

    // Delete the task
    await prisma.task.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting task:', error);
    throw new AppError('Failed to delete task', 500);
  }
};

export const assignTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { assigneeId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    // Get the task with project info
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            manager: true,
            members: {
              where: { userId }
            }
          }
        }
      }
    });

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    // Check if the assignee is a member of the project
    if (assigneeId) {
      const isMember = await prisma.projectMember.findFirst({
        where: {
          projectId: task.projectId,
          userId: assigneeId
        }
      });

      if (!isMember && task.project.managerId !== assigneeId) {
        throw new AppError('Cannot assign task to a non-member', 400);
      }
    }

    // Check permissions - only manager, admin, or current assignee can change assignment
    const isManager = task.project.managerId === userId;
    const isAdmin = task.project.members.some(member => 
      member.userId === userId && member.role === 'ADMIN'
    );
    const isCurrentAssignee = task.assigneeId === userId;

    if (!isManager && !isAdmin && !isCurrentAssignee) {
      throw new AppError('Not authorized to assign this task', 403);
    }

    // Update the task assignee
    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        assignee: assigneeId 
          ? { connect: { id: assigneeId } } 
          : { disconnect: true }
      },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json(updatedTask);
  } catch (error) {
    console.error('Error assigning task:', error);
    throw new AppError('Failed to assign task', 500);
  }
};

export const updateTaskStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    // Get the task with project info
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            manager: true,
            members: {
              where: { userId }
            }
          }
        },
        createdBy: true
      }
    });

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    // Check permissions - manager, admin, creator, or assignee can update status
    const isManager = task.project.managerId === userId;
    const isAdmin = task.project.members.some(member => 
      member.userId === userId && member.role === 'ADMIN'
    );
    const isCreator = task.createdById === userId;
    const isAssignee = task.assigneeId === userId;

    if (!isManager && !isAdmin && !isCreator && !isAssignee) {
      throw new AppError('Not authorized to update this task status', 403);
    }

    // Update the task status
    const updatedTask = await prisma.task.update({
      where: { id },
      data: { status },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json(updatedTask);
  } catch (error) {
    console.error('Error updating task status:', error);
    throw new AppError('Failed to update task status', 500);
  }
};

export const addTaskComment = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { content } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    // Check if the task exists and the user has access to it
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            manager: true,
            members: {
              where: { userId }
            }
          }
        }
      }
    });

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    // Check if user has access to the task's project
    const isManager = task.project.managerId === userId;
    const isMember = task.project.members.some(member => member.userId === userId);
    const isAssignee = task.assigneeId === userId;
    const isCreator = task.createdById === userId;

    if (!isManager && !isMember && !isAssignee && !isCreator) {
      throw new AppError('Not authorized to comment on this task', 403);
    }

    // Add the comment
    const comment = await prisma.comment.create({
      data: {
        content,
        task: {
          connect: { id: taskId }
        },
        user: {
          connect: { id: userId }
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    res.status(201).json(comment);
  } catch (error) {
    console.error('Error adding task comment:', error);
    throw new AppError('Failed to add task comment', 500);
  }
};

export const getTaskComments = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    // Check if the task exists and the user has access to it
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            manager: true,
            members: {
              where: { userId }
            }
          }
        }
      }
    });

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    // Check if user has access to the task's project
    const isManager = task.project.managerId === userId;
    const isMember = task.project.members.some(member => member.userId === userId);
    const isAssignee = task.assigneeId === userId;
    const isCreator = task.createdById === userId;

    if (!isManager && !isMember && !isAssignee && !isCreator) {
      throw new AppError('Not authorized to view comments for this task', 403);
    }

    // Get all comments for the task
    const comments = await prisma.comment.findMany({
      where: { taskId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(comments);
  } catch (error) {
    console.error('Error fetching task comments:', error);
    throw new AppError('Failed to fetch task comments', 500);
  }
};
