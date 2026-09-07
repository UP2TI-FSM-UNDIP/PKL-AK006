import React from 'react';

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

export default function FormField({
  label,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={`flex flex-col gap-1 ${className || ''}`}>
      <label className='text-sm font-medium text-gray-700 dark:text-gray-300'>{label}</label>
      {children}
    </div>
  );
}
