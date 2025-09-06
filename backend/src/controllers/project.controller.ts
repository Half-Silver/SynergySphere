import { Request, Response } from 'express';
import { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/error.middleware';

// Extend the Prisma client to include the projectMember model
type ProjectMemberWithUser = Prisma.ProjectMemberGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        name: true;
        email: true;
        role: true;
      };
    };
  };
}>;

type ProjectWithRelations = Prisma.ProjectGetPayload<{
  include: {
    manager: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
    tags: true;
    members: {
      include: {
        user: {
          select: {
            id: true;
            name: true;
            email: true;
            role: true;
          };
        };
      };
    };
    _count: {
      select: {
        tasks: boolean;
        members: boolean;
      };
    };
  };
}>;

export const createProject = async (req: Request, res: Response) => {
  try {
    const { name, description, deadline, tags } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        deadline: deadline ? new Date(deadline) : null,
        manager: {
          connect: { id: userId }
        },
        members: {
          create: [
            {
              user: { connect: { id: userId } },
              role: 'ADMIN'
            }
          ]
        },
        ...(tags && tags.length > 0 && {
          tags: {
            connectOrCreate: tags.map((tagName: string) => ({
              where: { name: tagName },
              create: { name: tagName }
            }))
          }
        })
      },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        tags: true,
        members: {
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
        }
      }
    });

    res.status(201).json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    throw new AppError('Failed to create project', 500);
  }
};

export const getProjects = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { search, status } = req.query;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { managerId: userId },
          { members: { some: { userId } } }
        ],
        ...(search && {
          OR: [
            { name: { contains: search as string, mode: 'insensitive' } },
            { description: { contains: search as string, mode: 'insensitive' } }
          ]
        }),
        ...(status && { status: status as string })
      },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        tags: true,
        _count: {
          select: {
            tasks: true,
            members: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw new AppError('Failed to fetch projects', 500);
  }
};

export const getProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        tags: true,
        members: {
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
        },
        tasks: {
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            status: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    // Check if user has access to this project
    const isMember = project.members.some((member: { userId: string }) => member.userId === userId) || project.managerId === userId;
    if (!isMember) {
      throw new AppError('Not authorized to access this project', 403);
    }

    res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    throw new AppError('Failed to fetch project', 500);
  }
};

export const updateProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { name, description, deadline, status, tags } = req.body;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    // Check if user is the manager or admin
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        manager: true,
        members: {
          where: { userId }
        }
      }
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    const isManager = project.managerId === userId;
    const isAdmin = project.members.some((member: { userId: string; role: string }) => member.userId === userId && member.role === 'ADMIN');

    if (!isManager && !isAdmin) {
      throw new AppError('Not authorized to update this project', 403);
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        name,
        description,
        deadline: deadline ? new Date(deadline) : null,
        status,
        ...(tags && {
          tags: {
            set: [], // Clear existing tags
            connectOrCreate: tags.map((tagName: string) => ({
              where: { name: tagName },
              create: { name: tagName }
            }))
          }
        })
      },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        tags: true,
        members: {
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
        }
      }
    });

    res.json(updatedProject);
  } catch (error) {
    console.error('Error updating project:', error);
    throw new AppError('Failed to update project', 500);
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    // Only the project manager can delete the project
    const project = await prisma.project.findUnique({
      where: { id },
      select: { managerId: true }
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    if (project.managerId !== userId) {
      throw new AppError('Not authorized to delete this project', 403);
    }

    await prisma.project.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting project:', error);
    throw new AppError('Failed to delete project', 500);
  }
};

export const addProjectMember = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { email, role = 'MEMBER' } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    // Check if the requester is the manager or an admin
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        manager: true,
        members: {
          where: { userId }
        }
      }
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    const isManager = project.managerId === userId;
    const isAdmin = project.members.some((member: { userId: string; role: string }) => member.userId === userId && member.role === 'ADMIN');

    if (!isManager && !isAdmin) {
      throw new AppError('Not authorized to add members to this project', 403);
    }

    // Find the user to add
    const userToAdd = await prisma.user.findUnique({
      where: { email }
    });

    if (!userToAdd) {
      throw new AppError('User not found', 404);
    }

    // Check if user is already a member
    const existingMember = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId: userToAdd.id
      }
    });

    if (existingMember) {
      throw new AppError('User is already a member of this project', 400);
    }

    // Add user to project
    const member = await prisma.projectMember.create({
      data: {
        projectId,
        userId: userToAdd.id,
        role
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

    res.status(201).json(member);
  } catch (error) {
    console.error('Error adding project member:', error);
    throw new AppError('Failed to add project member', 500);
  }
};

export const removeProjectMember = async (req: Request, res: Response) => {
  try {
    const { projectId, userId: memberId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    // Check if the requester is the manager or an admin
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        manager: true,
        members: {
          where: { userId: memberId }
        }
      }
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    const isManager = project.managerId === userId;
    const isAdmin = project.members.some((member: { userId: string; role: string }) => member.userId === userId && member.role === 'ADMIN');

    if (!isManager && !isAdmin) {
      throw new AppError('Not authorized to remove members from this project', 403);
    }

    // Prevent removing the project manager
    if (project.managerId === memberId) {
      throw new AppError('Cannot remove the project manager', 400);
    }

    // Remove member
    await prisma.projectMember.deleteMany({
      where: {
        projectId,
        userId: memberId
      }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error removing project member:', error);
    throw new AppError('Failed to remove project member', 500);
  }
};

export const updateProjectMemberRole = async (req: Request, res: Response) => {
  try {
    const { projectId, userId: memberId } = req.params;
    const { role } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    // Only the project manager can update member roles
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { managerId: true }
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    if (project.managerId !== userId) {
      throw new AppError('Not authorized to update member roles', 403);
    }

    // Prevent changing the manager's role
    if (project.managerId === memberId) {
      throw new AppError('Cannot change the role of the project manager', 400);
    }

    // Update member role
    const updatedMember = await prisma.projectMember.update({
      where: {
        projectId_userId: {
          projectId,
          userId: memberId
        }
      },
      data: { role },
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

    if (!updatedMember) {
      throw new AppError('Member not found in this project', 404);
    }

    res.json(updatedMember);
  } catch (error) {
    console.error('Error updating project member role:', error);
    throw new AppError('Failed to update project member role', 500);
  }
};
