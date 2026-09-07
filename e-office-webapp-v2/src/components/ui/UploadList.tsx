import React from 'react';
import { FileText, Eye, Trash2, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils'; // Pastikan path utils sesuai dengan project Anda

interface FileItemProps {
  fileName: string;
  fileSize: string;
  dropdownOptions?: string[];
  onView?: () => void;
  onDelete?: () => void;
  className?: string;
  icon?: React.ReactNode;
  selectedOption?: string;
  onOptionChange?: (option: string) => void;
}

export default function UploadList({
  fileName,
  fileSize,
  onView,
  onDelete,
  className,
  icon,
  dropdownOptions = [],
  selectedOption,
  onOptionChange,
}: FileItemProps) {
  const options = dropdownOptions;

  return (
    <div
      className={cn(
        'flex items-center justify-between bg-white dark:bg-gray-800 shadow-sm',
        'border border-solid border-slate-200 dark:border-gray-700',
        'rounded-lg', // 8px radius
        'px-6 py-3', // 12px padding (px-6 = 24px horizontal, py-3 = 12px vertical)
        'gap-4', // 16px gap
        'transition-colors duration-300',
        className
      )}
    >
      {/* Sisi Kiri: Icon dan Info File */}
      <div className='flex flex-1 items-center gap-3 min-w-0'>
        <div className='shrink-0 flex items-center justify-center w-10 h-10'>
          {icon ? icon : <FileText />}
        </div>
        <div className='flex flex-col min-w-0'>
          <span className='truncate text-sm font-semibold text-slate-700 dark:text-gray-200'>
            {fileName}
          </span>
          {/* Mega Byte */}
          <span className='text-xs text-slate-400 dark:text-gray-500'>{fileSize}</span>
        </div>
      </div>

      {/* Sisi Kanan: Dropdown dan Action Buttons */}
      <div className='flex shrink-0 items-center gap-4'>
        {/* Dropdown / Select */}
        {options.length > 0 && (
          <div className='relative'>
            <select
              className='appearance-none pl-3 pr-8 py-1.5 border border-slate-200 dark:border-gray-600 rounded-md bg-slate-50 dark:bg-gray-700 hover:bg-slate-100 dark:hover:bg-gray-600 transition-colors text-xs font-medium text-slate-600 dark:text-gray-300 cursor-pointer focus:outline-none focus:ring-1 focus:ring-slate-300 dark:focus:ring-gray-500'
              value={selectedOption || ''}
              onChange={(e) => {
                if (onOptionChange) onOptionChange(e.target.value);
              }}
            >
              {options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <ChevronDown className='absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500 pointer-events-none' />
          </div>
        )}

        {/* Action Buttons */}
        <div className='flex items-center gap-2'>
          <button
            onClick={onView}
            className='p-2 text-slate-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-all'
            title='Lihat File'
          >
            <Eye className='w-5 h-5' />
          </button>
          <button
            onClick={onDelete}
            className='p-2 text-slate-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-all'
            title='Hapus File'
          >
            <Trash2 className='w-5 h-5' />
          </button>
        </div>
      </div>
    </div>
  );
}
