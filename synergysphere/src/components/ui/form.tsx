import * as React from 'react';
import { FormProvider, Controller } from 'react-hook-form';
import clsx from 'clsx';

export const Form = FormProvider as any;

export const FormItem = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={clsx('space-y-2', className)} {...props} />
);

export const FormLabel = ({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className={clsx('text-sm font-medium', className)} {...props} />
);

export const FormDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={clsx('text-[0.8rem] text-muted-foreground', className)} {...props} />
);

export const FormMessage = ({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={clsx('text-sm text-red-600', className)} {...props}>
    {children}
  </p>
);

export const FormControl = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={clsx('space-y-2', className)} {...props} />
);

// Loosely typed FormField to avoid TS generic constraints issues in a template project
export function FormField(props: any) {
  return (
    <Controller
      {...(props as any)}
      render={({ field, fieldState }: any) => (
        <div>
          {props.render({ field, fieldState })}
          {fieldState?.error?.message ? (
            <FormMessage>{fieldState.error.message}</FormMessage>
          ) : null}
        </div>
      )}
    />
  );
}
