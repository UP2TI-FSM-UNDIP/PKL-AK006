import React from 'react';

interface FormErrorProps {
  message: string;
  className?: string;
  show?: boolean;
}

export function FormError({
  message,
  className = '',
  show = true,
}: FormErrorProps) {
  if (!show || !message) return null;
  return <p className={`text-xs text-red-500 dark:text-red-400 mt-1 ${className}`}>{message}</p>;
}
