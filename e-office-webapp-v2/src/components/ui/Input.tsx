import * as React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, readOnly, ...props }, ref) => {
  return (
    <input
      type={type}
      readOnly={readOnly}
      className={cn(
        // Base styles
        'flex w-full rounded-[8px] pt-2.5 pr-3 pb-2.5 pl-3 text-sm transition-all duration-200 outline-none file:border-0 file:bg-transparent file:text-sm file:font-medium',

        // Read-only styles
        readOnly
          ? 'bg-slate-50 dark:bg-gray-700 text-slate-700 dark:text-gray-300 border border-transparent cursor-default focus:ring-0'
          : // Editable styles
          'bg-white dark:bg-gray-700 text-slate-900 dark:text-white border border-slate-200 dark:border-gray-600 placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 dark:focus:ring-blue-400/20',

        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export default Input;
