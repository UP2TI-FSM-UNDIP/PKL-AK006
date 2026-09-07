import React from 'react';

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
}

const PageWrapper: React.FC<PageWrapperProps> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`max-w-6xl mx-auto pt-20 pb-8 gap-8 px-4 lg:px-24 ${className}`}>
      {children}
    </div>
  );
};

export default PageWrapper;
