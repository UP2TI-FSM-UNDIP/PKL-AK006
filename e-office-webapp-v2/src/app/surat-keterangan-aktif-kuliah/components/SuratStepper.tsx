'use client';

import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from '@/components/ui/Stepper';
import { Check, LoaderCircleIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from '@/hooks/use-app-router'
import { useSearchParams } from 'next/navigation';
import { useProfile } from '@/context/AK006';

const steps = [
  { title: 'Info Pengajuan', route: '/surat-keterangan-aktif-kuliah/identitas-pemohon' },
  { title: 'Detail Pengajuan', route: '/surat-keterangan-aktif-kuliah/detail-pengajuan' },
  { title: 'Lampiran', route: '/surat-keterangan-aktif-kuliah/lampiran' },
  { title: 'Review & Ajukan', route: '/surat-keterangan-aktif-kuliah/review' },
];

export default function SuratStepper({ Value = 1 }: { Value?: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { reachedStep } = useProfile();

  const handleStepClick = (stepIndex: number) => {
    // Only navigate to steps already reached AND not the current step
    const isReached = stepIndex < reachedStep;
    const isCurrent = stepIndex + 1 === Value;

    if (isReached && !isCurrent) {
      // Preserve query params (for revision mode)
      const letterIdParam = searchParams.get('letterId');
      const modeParam = searchParams.get('mode');
      const queryParams = letterIdParam && modeParam
        ? `?letterId=${letterIdParam}&mode=${modeParam}`
        : '';
      router.push(`${steps[stepIndex].route}${queryParams}`);
    }
  };

  return (
    <Stepper
      defaultValue={Value}
      indicators={{
        completed: <Check className='size-4' />,
        loading: <LoaderCircleIcon className='size-4 animate-spin' />,
      }}
      className='space-y-8 my-8 px-5'
    >
      <StepperNav>
        {steps.map((step, index) => {
          const isFirst = index === 0;
          const isLast = index === steps.length - 1;
          const isSecondToLast = index === steps.length - 2;

          // Navigation logic: follow reachedStep
          const isReached = index < reachedStep;
          const isCurrent = index + 1 === Value;
          const canNavigate = isReached && !isCurrent;

          // Visual logic: follow current sequence (Value)
          const isSequencePassed = index + 1 < Value;
          const isSequenceActive = index + 1 === Value;

          return (
            <StepperItem
              key={index}
              step={index + 1}
              className={cn(
                'relative flex-1',
                isFirst
                  ? 'justify-start'
                  : isLast
                    ? 'justify-end'
                    : 'justify-center'
              )}
            >
              <StepperTrigger
                className={cn(
                  'flex flex-col items-center gap-2.5 transition-all duration-200',
                  canNavigate ? 'cursor-pointer hover:opacity-75' : 'cursor-default',
                  !isReached && !isCurrent ? 'opacity-40 grayscale-[0.5]' : 'opacity-100'
                )}
                onClick={() => handleStepClick(index)}
              >
                <StepperIndicator className='size-8 data-[state=completed]:bg-[#137FEC] data-[state=active]:bg-[#137FEC] data-[state=completed]:text-white data-[state=active]:text-white shadow-sm'>
                  {index + 1}
                </StepperIndicator>
                <StepperTitle className={cn(
                  "text-xs font-medium transition-colors",
                  isSequencePassed || isSequenceActive ? "text-[#137FEC]" : "text-gray-400"
                )}>
                  {step.title}
                </StepperTitle>
              </StepperTrigger>

              {steps.length > index + 1 && (
                <StepperSeparator
                  className={cn(
                    'absolute top-4 m-0 block h-0.5 shrink-0 rounded-full transition-colors duration-500',
                    isSequencePassed ? 'bg-[#137FEC]' : 'bg-gray-200',
                    isFirst
                      ? 'left-16 w-[calc(150%-5rem)]'
                      : isSecondToLast
                        ? 'left-[calc(50%+1rem)] w-[calc(150%-5rem)]'
                        : 'left-[calc(50%+1rem)] w-[calc(100%-2rem)]'
                  )}
                />
              )}
            </StepperItem>
          );
        })}
      </StepperNav>
    </Stepper>
  );
}
