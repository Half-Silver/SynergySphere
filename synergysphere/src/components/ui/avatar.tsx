import * as React from 'react';
import clsx from 'clsx';

export const Avatar = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <div className={clsx('relative inline-flex items-center justify-center rounded-full bg-muted text-muted-foreground overflow-hidden', className)}>
    {children}
  </div>
);

export const AvatarImage = ({ src, alt }: { src?: string; alt?: string }) => (
  src ? <img src={src} alt={alt} className="h-full w-full object-cover" /> : null
);

export const AvatarFallback = ({ children }: { children?: React.ReactNode }) => (
  <span className="h-full w-full flex items-center justify-center text-xs font-medium">
    {children}
  </span>
);

export default Avatar;
