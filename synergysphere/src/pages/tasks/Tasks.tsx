import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Plus, 
  Filter, 
  Search, 
  ListFilter, 
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Circle,
  User,
  FileText,
  ChevronDown,
  MoreVertical
} from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem
} from '@/components/ui/dropdown-menu';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { tasksApi } from '@/lib/api';

type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  dueDate?: string;
  project: {
    id: string;
    name: string;
  };
  assignee?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export const Tasks = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<keyof Task>('dueDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Fetch tasks
  const { data: tasks = [] as Task[], isLoading } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: () => tasksApi.getTasks().then((res) => res.data as Task[]),
  });

  // Filter and sort tasks
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    
    // Add more filters as needed
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (!sortField) return 0;
    
    let aValue = a[sortField as keyof Task];
    let bValue = b[sortField as keyof Task];
    
    // Handle nested properties
    if (sortField === 'project') {
      aValue = a.project.name;
      bValue = b.project.name;
    } else if (sortField === 'assignee') {
      aValue = a.assignee?.name || '';
      bValue = b.assignee?.name || '';
    }
    
    if (aValue === bValue) return 0;
    
    const direction = sortDirection === 'asc' ? 1 : -1;
    
    if (aValue === undefined || aValue === null) return 1 * direction;
    if (bValue === undefined || bValue === null) return -1 * direction;
    
    if (aValue < bValue) return -1 * direction;
    if (aValue > bValue) return 1 * direction;
    
    return 0;
  });

  const handleSort = (field: keyof Task) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'TODO':
        return <Circle className="h-3 w-3 text-yellow-500" />;
      case 'IN_PROGRESS':
        return <Clock className="h-3 w-3 text-blue-500" />;
      case 'DONE':
        return <CheckCircle2 className="h-3 w-3 text-green-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between space-y-4 sm:flex-row sm:items-center sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">
            View and manage all your tasks in one place
          </p>
        </div>
        <Button asChild>
          <Link to="/tasks/new">
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <Filter className="h-4 w-4 mr-2" />
                Status
                <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>Filter by status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={statusFilter === 'all'}
                onCheckedChange={() => setStatusFilter('all')}
              >
                All Statuses
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilter === 'TODO'}
                onCheckedChange={(checked) => setStatusFilter(checked ? 'TODO' : 'all')}
              >
                <div className="flex items-center">
                  <Circle className="h-3 w-3 text-yellow-500 mr-2" />
                  To Do
                </div>
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilter === 'IN_PROGRESS'}
                onCheckedChange={(checked) => setStatusFilter(checked ? 'IN_PROGRESS' : 'all')}
              >
                <div className="flex items-center">
                  <Clock className="h-3 w-3 text-blue-500 mr-2" />
                  In Progress
                </div>
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilter === 'DONE'}
                onCheckedChange={(checked) => setStatusFilter(checked ? 'DONE' : 'all')}
              >
                <div className="flex items-center">
                  <CheckCircle2 className="h-3 w-3 text-green-500 mr-2" />
                  Done
                </div>
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <ListFilter className="h-4 w-4 mr-2" />
                Sort
                <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleSort('title')}>
                Title {sortField === 'title' && (sortDirection === 'asc' ? '↑' : '↓')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('dueDate')}>
                Due Date {sortField === 'dueDate' && (sortDirection === 'asc' ? '↑' : '↓')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('status')}>
                Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('project')}>
                Project {sortField === 'project' && (sortDirection === 'asc' ? '↑' : '↓')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <span className="sr-only">Complete</span>
              </TableHead>
              <TableHead>Task</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead className="w-[50px]">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading state
              [1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-4 rounded" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                </TableRow>
              ))
            ) : filteredTasks.length > 0 ? (
              // Tasks list
              filteredTasks.map((task) => (
                <TableRow key={task.id} className="group">
                  <TableCell>
                    <Checkbox 
                      checked={task.status === 'DONE'}
                      onCheckedChange={(checked) => {
                        // Handle task status update
                        console.log('Update task status', task.id, checked);
                      }}
                      className="opacity-0 group-hover:opacity-100 data-[state=checked]:opacity-100"
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link to={`/tasks/${task.id}`} className="hover:underline">
                      {task.title}
                    </Link>
                    {task.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {task.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Link 
                      to={`/projects/${task.project.id}`} 
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {task.project.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={task.status === 'DONE' ? 'default' : 'outline'}
                      className="flex items-center gap-1.5"
                    >
                      {getStatusIcon(task.status)}
                      {task.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {task.dueDate ? (
                      <div className="flex items-center text-sm">
                        <CalendarIcon className="mr-1 h-4 w-4 text-muted-foreground" />
                        {format(new Date(task.dueDate), 'MMM d, yyyy')}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">No due date</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {task.assignee ? (
                      <div className="flex items-center">
                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted text-muted-foreground text-xs">
                          {task.assignee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                        <span className="ml-2 text-sm">{task.assignee.name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>Duplicate</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              // Empty state
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mb-2" />
                    <h3 className="text-lg font-medium">No tasks found</h3>
                    <p className="text-sm text-muted-foreground">
                      {searchQuery 
                        ? 'No tasks match your search. Try a different search term.'
                        : 'Get started by creating a new task.'}
                    </p>
                    {!searchQuery && (
                      <Button className="mt-4" asChild>
                        <Link to="/tasks/new">
                          <Plus className="h-4 w-4 mr-2" />
                          New Task
                        </Link>
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Tasks;
