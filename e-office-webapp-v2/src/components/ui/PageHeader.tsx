'use client';
import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, description }) => (
  <>
    <h1 className='text-3xl font-bold mb-2 text-gray-900 dark:text-white'>{title}</h1>
    {description && <p className='text-gray-500 dark:text-gray-400 mb-6'>{description}</p>}
  </>
);

export default PageHeader;
