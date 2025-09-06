import { Request, Response, NextFunction } from 'express';
import { prisma } from '../index';
import { ApiError } from '../middleware/errorHandler';

export const getProjects = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get projects where user is a member or manager
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { managerId: req.user.id },
          { members: { some: { id: req.user.id } } },
        ],
      },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            tasks: true,
            members: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
    });
  } catch (error) {
    next(error);
  }
};

export const getProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
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
        tasks: {
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      return next(new ApiError(404, `Project not found with id of ${req.params.id}`));
    }

    // Check if user has access to this project
    if (project.managerId !== req.user.id && !project.members.some((m: any) => m.id === req.user.id)) {
      return next(new ApiError(403, 'Not authorized to access this project'));
    }

    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

export const createProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, deadline, tags = [] } = req.body;

    // Create project
    const project = await prisma.project.create({
      data: {
        name,
        description,
        deadline: deadline ? new Date(deadline) : null,
        managerId: req.user.id,
        members: {
          connect: { id: req.user.id }, // Add creator as member
        },
        tags: {
          connectOrCreate: tags.map((tag: string) => ({
            where: { name: tag },
            create: { name: tag },
          })),
        },
      },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tags: true,
      },
    });

    res.status(201).json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let project = await prisma.project.findUnique({
      where: { id: req.params.id },
    });

    if (!project) {
      return next(new ApiError(404, `Project not found with id of ${req.params.id}`));
    }

    // Make sure user is project manager
    if (project.managerId !== req.user.id) {
      return next(new ApiError(403, 'Not authorized to update this project'));
    }

    const { name, description, deadline, tags } = req.body;

    // Update project
    project = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        name,
        description,
        deadline: deadline ? new Date(deadline) : null,
        ...(tags && {
          tags: {
            set: [],
            connectOrCreate: tags.map((tag: string) => ({
              where: { name: tag },
              create: { name: tag },
            })),
          },
        }),
      },
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
        tags: true,
      },
    });

    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
    });

    if (!project) {
      return next(new ApiError(404, `Project not found with id of ${req.params.id}`));
    }

    // Make sure user is project manager
    if (project.managerId !== req.user.id) {
      return next(new ApiError(403, 'Not authorized to delete this project'));
    }

    await prisma.project.delete({
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

export const addProjectMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    const projectId = req.params.id;

    // Find project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true },
    });

    if (!project) {
      return next(new ApiError(404, `Project not found with id of ${projectId}`));
    }

    // Make sure user is project manager
    if (project.managerId !== req.user.id) {
      return next(new ApiError(403, 'Not authorized to add members to this project'));
    }

    // Find user to add
    const userToAdd = await prisma.user.findUnique({
      where: { email },
    });

    if (!userToAdd) {
      return next(new ApiError(404, `User with email ${email} not found`));
    }

    // Check if user is already a member
    if (project.members.some((member) => member.id === userToAdd.id)) {
      return next(new ApiError(400, 'User is already a member of this project'));
    }

    // Add user to project
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        members: {
          connect: { id: userToAdd.id },
        },
      },
      include: {
        members: {
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
      data: updatedProject.members,
    });
  } catch (error) {
    next(error);
  }
};

export const removeProjectMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: projectId, userId } = req.params;

    // Find project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true },
    });

    if (!project) {
      return next(new ApiError(404, `Project not found with id of ${projectId}`));
    }

    // Make sure user is project manager
    if (project.managerId !== req.user.id) {
      return next(new ApiError(403, 'Not authorized to remove members from this project'));
    }

    // Check if user is a member
    if (!project.members.some((member) => member.id === userId)) {
      return next(new ApiError(400, 'User is not a member of this project'));
    }

    // Remove user from project
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        members: {
          disconnect: { id: userId },
        },
      },
      include: {
        members: {
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
      data: updatedProject.members,
    });
  } catch (error) {
    next(error);
  }
};
