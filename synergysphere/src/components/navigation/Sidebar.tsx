import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  Settings,
  PlusCircle,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'My Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Team', href: '/team', icon: Users },
];

export const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="fixed top-0 left-0 z-20 hidden h-full pt-16 w-64 bg-white border-r border-gray-200 lg:block">
      <div className="h-full overflow-y-auto">
        <div className="px-4 py-4">
          <Link
            to="/projects/new"
            className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            New Project
          </Link>
        </div>
        <nav className="px-2 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  isActive
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                )}
              >
                <item.icon
                  className={cn(
                    isActive ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500',
                    'mr-3 flex-shrink-0 h-5 w-5'
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-200">
          <Link
            to="/settings"
            className={cn(
              'flex items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900',
              location.pathname === '/settings' && 'bg-gray-100 text-gray-900'
            )}
          >
            <Settings
              className={cn(
                'mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500',
                location.pathname === '/settings' && 'text-gray-500'
              )}
              aria-hidden="true"
            />
            Settings
          </Link>
        </div>
      </div>
    </aside>
  );
};
