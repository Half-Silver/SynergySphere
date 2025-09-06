import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import clsx from 'clsx';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'icon';
}

const buttonVariants = (
  variant: ButtonProps['variant'] = 'default',
  size: ButtonProps['size'] = 'default'
) =>
  clsx(
    'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
    variant === 'default' && 'bg-primary text-primary-foreground hover:opacity-90',
    variant === 'outline' && 'border border-input bg-background hover:bg-muted',
    variant === 'ghost' && 'hover:bg-muted',
    variant === 'destructive' && 'bg-red-600 text-white hover:bg-red-700',
    size === 'default' && 'h-10 px-4 py-2',
    size === 'sm' && 'h-9 px-3',
    size === 'icon' && 'h-9 w-9'
  );

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={clsx(buttonVariants(variant, size), className)}
        ref={ref as any}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export default Button;
