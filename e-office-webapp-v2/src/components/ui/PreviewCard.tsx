import React from 'react';
import FormSection from './FormSection';

export interface Preview {
  url: string;
  type: string;
  name: string;
}

export interface PreviewCardProps {
  previews?: Preview[];
  renderPreview: (preview: Preview) => React.ReactNode;
}

export function PreviewCard({ previews, renderPreview }: PreviewCardProps) {
  return (
    <FormSection className=' md:grid-cols-1'>
      <div className='flex flex-col gap-4'>
        {(previews ?? []).map((preview, idx) => (
          <div
            key={preview.url + idx}
            className='relative w-full max-w-lg border rounded-lg overflow-hidden bg-gray-50 mx-auto'
          >
            {renderPreview(preview)}
          </div>
        ))}
      </div>
    </FormSection>
  );
}
