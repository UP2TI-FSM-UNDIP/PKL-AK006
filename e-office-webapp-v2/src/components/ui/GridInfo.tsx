'use client';
import React from 'react';

interface GridInfoProps {
  label: string;
  value: React.ReactNode;
}

const GridInfo: React.FC<GridInfoProps> = ({ label, value }) => {
  return (
    <div className='w-full grid grid-cols-2 gap-2 pt-3 border-t border-gray-300 items-center'>
      <p>{label}</p>
      <p>{value}</p>
    </div>
  );
};

export default GridInfo;
