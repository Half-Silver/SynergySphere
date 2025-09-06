import * as React from 'react';
import clsx from 'clsx';

export const Separator = ({ className, orientation = 'horizontal', ...props }: React.HTMLAttributes<HTMLDivElement> & { orientation?: 'horizontal' | 'vertical' }) => (
  <div
    role="separator"
    aria-orientation={orientation}
    className={clsx(
      'shrink-0 bg-muted',
      orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
      className
    )}
    {...props}
  />
);

export default Separator;
