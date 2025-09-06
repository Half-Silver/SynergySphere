import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { projectsApi, tasksApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PlusCircle, Clock, CheckCircle, AlertCircle, ListChecks } from 'lucide-react';

export const Dashboard = () => {
  // Fetch recent projects
  const { data: projects, isLoading: isLoadingProjects } = useQuery({
    queryKey: ['recent-projects'],
    queryFn: () => projectsApi.getProjects(),
  });

  // Fetch user's tasks
  const { data: tasks, isLoading: isLoadingTasks } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: () => tasksApi.getMyTasks(),
  });

  // Calculate task statistics
  const todoTasks = tasks?.data?.filter((task: any) => task.status === 'TODO') || [];
  const inProgressTasks = tasks?.data?.filter((task: any) => task.status === 'IN_PROGRESS') || [];
  const completedTasks = tasks?.data?.filter((task: any) => task.status === 'DONE') || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <Button asChild>
          <Link to="/projects/new">
            <PlusCircle className="w-4 h-4 mr-2" />
            New Project
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Projects"
          value={projects?.data?.length || 0}
          icon={<ListChecks className="w-4 h-4 text-muted-foreground" />}
          isLoading={isLoadingProjects}
        />
        <StatsCard
          title="To Do"
          value={todoTasks.length}
          icon={<AlertCircle className="w-4 h-4 text-yellow-500" />}
          isLoading={isLoadingTasks}
          description={`${todoTasks.length} tasks to do`}
        />
        <StatsCard
          title="In Progress"
          value={inProgressTasks.length}
          icon={<Clock className="w-4 h-4 text-blue-500" />}
          isLoading={isLoadingTasks}
          description={`${inProgressTasks.length} tasks in progress`}
        />
        <StatsCard
          title="Completed"
          value={completedTasks.length}
          icon={<CheckCircle className="w-4 h-4 text-green-500" />}
          isLoading={isLoadingTasks}
          description={`${completedTasks.length} tasks completed`}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Projects */}
        <Card className="col-span-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Projects</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/projects">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingProjects ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : projects?.data?.length > 0 ? (
              <div className="space-y-4">
                {projects.data.slice(0, 5).map((project: any) => (
                  <Link
                    key={project.id}
                    to={`/projects/${project.id}`}
                    className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-md bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-medium">
                        {project.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="font-medium text-gray-900">{project.name}</h3>
                      <p className="text-sm text-gray-500">
                        Created on {formatDate(project.createdAt)}
                      </p>
                    </div>
                    <div className="text-sm text-gray-500">
                      {project.tasks?.length || 0} tasks
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No projects yet</p>
                <Button className="mt-2" asChild>
                  <Link to="/projects/new">Create your first project</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card className="col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Upcoming Tasks</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/tasks">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingTasks ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : tasks?.data?.length > 0 ? (
              <div className="space-y-4">
                {tasks.data
                  .filter((task: any) => task.status !== 'DONE')
                  .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                  .slice(0, 5)
                  .map((task: any) => (
                    <div key={task.id} className="border rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{task.title}</h4>
                          <p className="text-sm text-gray-500">
                            {task.project?.name || 'No Project'}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            task.status === 'TODO'
                              ? 'bg-yellow-100 text-yellow-800'
                              : task.status === 'IN_PROGRESS'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>
                      {task.dueDate && (
                        <div className="mt-2 text-xs text-gray-500">
                          Due {formatDate(task.dueDate)}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No upcoming tasks</p>
                <Button className="mt-2" asChild>
                  <Link to="/projects/new">Create a project to get started</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const StatsCard = ({
  title,
  value,
  icon,
  isLoading,
  description,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  isLoading: boolean;
  description?: string;
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="h-4 w-4 text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default Dashboard;
