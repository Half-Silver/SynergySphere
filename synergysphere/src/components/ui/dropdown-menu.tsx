import * as React from 'react';
import * as Dropdown from '@radix-ui/react-dropdown-menu';
import clsx from 'clsx';

export const DropdownMenu = Dropdown.Root;
export const DropdownMenuTrigger = Dropdown.Trigger;

export const DropdownMenuContent = ({ className, ...props }: Dropdown.DropdownMenuContentProps) => (
  <Dropdown.Content
    className={clsx(
      'z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
      'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2',
      'data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
      className
    )}
    sideOffset={4}
    {...props}
  />
);

export const DropdownMenuItem = ({ className, ...props }: Dropdown.DropdownMenuItemProps) => (
  <Dropdown.Item
    className={clsx(
      'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none',
      'focus:bg-accent focus:text-accent-foreground',
      className
    )}
    {...props}
  />
);

export const DropdownMenuCheckboxItem = ({ className, ...props }: Dropdown.DropdownMenuCheckboxItemProps) => (
  <Dropdown.CheckboxItem
    className={clsx(
      'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none',
      'focus:bg-accent focus:text-accent-foreground',
      className
    )}
    {...props}
  />
);

export const DropdownMenuLabel = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={clsx('px-2 py-1.5 text-sm font-semibold', className)} {...props} />
);

export const DropdownMenuSeparator = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={clsx('my-1 h-px bg-muted', className)} {...props} />
);

export default DropdownMenu;
