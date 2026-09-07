'use client';

interface FormActionsProps {
  onBack?: () => void;
  onSaveDraft?: () => void;
  onNext?: () => void;
  onPreview?: () => void;
  disableNext?: boolean;
}

export default function FormActions({
  onBack,
  onSaveDraft,
  onNext,
  onPreview,
  disableNext = false,
}: FormActionsProps) {
  'use client';
  return (
    <div className='flex justify-between w-full mx-auto'>
      <button
        type='button'
        className='px-4 py-2 rounded bg-gray-100 text-gray-700 cursor-pointer'
        onClick={onBack}
      >
        Kembali
      </button>
      {onPreview && (
        <button
          type='button'
          className='px-4 py-2 rounded bg-green-500 text-white cursor-pointer'
          onClick={onPreview}
        >
          Preview
        </button>
      )}
      <div className='flex gap-2'>
        <button
          type='button'
          className='px-4 py-2 rounded border-2 border-blue-500 text-blue-500 font-bold bg-white cursor-pointer'
          onClick={onSaveDraft}
        >
          Simpan Draft
        </button>
        <button
          type='button'
          className={`px-4 py-2 rounded text-white transition-all ${
            disableNext
              ? 'bg-gray-400 cursor-not-allowed opacity-60'
              : 'bg-[#0EA5E9] cursor-pointer hover:bg-[#0284C7]'
          }`}
          disabled={disableNext}
          onClick={onNext}
        >
          Lanjut
        </button>
      </div>
    </div>
  );
}
