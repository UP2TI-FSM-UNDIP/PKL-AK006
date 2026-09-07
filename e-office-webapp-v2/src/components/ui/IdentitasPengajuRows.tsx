import React from 'react';

export interface IdentitasPengajuRowsProps {
  rows: { label: string; value: string | undefined | null }[];
}

export function IdentitasPengajuRows({ rows }: IdentitasPengajuRowsProps) {
  return (
    <div className='mt-2 grid grid-cols-1 gap-4'>
      {rows.map((row, idx) => (
        <div key={row.label} className='relative'>
          {idx >= 0 && (
            <div
              className='absolute left-0 right-0 h-px bg-gray-200'
              style={{
                top: 0,
              }}
            />
          )}
          <div className='grid grid-cols-2 gap-2 py-2 px-2 items-center'>
            <p className='text-gray-500 pr-4'>{row.label}</p>
            <p className='font-medium wrap-break-words'>{row.value || '-'}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
