import React from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface FormSuratActionsProps {
  onBack: () => void;
  onSaveDraft: () => void;
  onNext: () => void;
  disableNext?: boolean;
  showError?: boolean;
}

export function FormSuratActions({
  onBack,
  onSaveDraft,
  onNext,
  disableNext = false,
  showError = false,
}: FormSuratActionsProps) {
  return (
    <div className='flex justify-between w-full mx-auto mt-6'>
      <Button className='px-6 py-5' variant='secondary' onClick={onBack}>
        Kembali
      </Button>
      <div className='flex gap-3'>
        <Button className='px-6 py-5' variant='outline' onClick={onSaveDraft}>
          Simpan Draft
        </Button>
        <Button
          className={cn(
            'px-6 py-5',
            showError || disableNext ? 'opacity-50' : ''
          )}
          variant='primary'
          onClick={onNext}
          //   disabled={showError || disableNext}
        >
          Lanjut
        </Button>
      </div>
    </div>
  );
}
