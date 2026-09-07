import React from 'react';
import { cn } from '@/lib/utils';

export default function FormSection({
  children,
  className,
  title,
  description,
}: {
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
}) {
  return (
    <section className='bg-white dark:bg-gray-800 rounded-xl shadow dark:shadow-blue-900/10 p-8 w-full mx-auto mb-8 flex flex-col gap-6 transition-colors duration-300'>
      {(title || description) && (
        <div className='flex flex-col gap-1'>
          {title && <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>{title}</h3>}
          {description && (
            <div className='text-sm text-gray-500 dark:text-gray-400'>{description}</div>
          )}
        </div>
      )}
      <div className={cn('grid grid-cols-1 md:grid-cols-2 gap-6', className)}>
        {children}
      </div>
    </section>
  );
}
