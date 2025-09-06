import * as React from 'react';
import clsx from 'clsx';

export const Skeleton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={clsx('animate-pulse rounded-md bg-muted', className)}
    {...props}
  />
);

export default Skeleton;
