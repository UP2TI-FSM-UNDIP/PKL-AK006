'use client';

import React, {
  createContext,
  useState,
  ReactNode,
  useContext,
  useEffect,
} from 'react';

export type FlexibleValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | { [key: string]: FlexibleValue }
  | FlexibleValue[];

export interface FlexibleData {
  [key: string]: FlexibleValue;
}

interface FormState {
  data: FlexibleData;
  step: number;
}

// 2. Definisi Tipe untuk Context
interface MultiStepContextType {
  formData: FlexibleData;
  reachedStep: number;
  // Pastikan parameter 'data' bertipe any atau FlexibleData, BUKAN string
  saveStepData: (
    stepKey: string,
    data: FlexibleData,
    nextStepIndex?: number
  ) => void;
  clearAllData: () => void;
}

const MultiStepContext = createContext<MultiStepContextType | undefined>(
  undefined
);

export const MultiStepProvider = ({
  children,
  storageKey = 'app_form_data',
  initialData = {},
}: {
  children: ReactNode;
  storageKey?: string;
  initialData?: FlexibleData;
}) => {
  // 3. Lazy Initializer untuk membaca localStorage
  const [state, setState] = useState<FormState>(() => {
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem(storageKey);
      const savedStep = localStorage.getItem(`${storageKey}_step`);

      const mergedData = {
        ...initialData, // Data dari database/props
        ...(savedData ? JSON.parse(savedData) : {}), // Data dari browser (punya prioritas lebih tinggi)
      };

      return {
        data: mergedData,
        step: savedStep ? parseInt(savedStep) : 0,
      };
    }
    return { data: initialData, step: 0 };
  });

  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Menghindari cascading render error dengan requestAnimationFrame
    const handle = requestAnimationFrame(() => {
      setIsHydrated(true);
    });
    return () => cancelAnimationFrame(handle);
  }, []);

  // 4. Implementasi fungsi simpan yang diperbaiki
  const saveStepData = (
    stepKey: string,
    newData: FlexibleData,
    nextStepIndex?: number
  ) => {
    setState((prev) => {
      const currentStepData = prev.data[stepKey] || {};

      const updatedData = {
        ...prev.data,
        [stepKey]: {
          ...(typeof currentStepData === 'object' ? currentStepData : {}),
          ...newData,
        },
      };

      localStorage.setItem(storageKey, JSON.stringify(updatedData));

      let updatedStep = prev.step;
      if (nextStepIndex !== undefined && nextStepIndex > prev.step) {
        updatedStep = nextStepIndex;
        localStorage.setItem(`${storageKey}_step`, updatedStep.toString());
      }

      return { data: updatedData, step: updatedStep };
    });
  };

  const clearAllData = () => {
    setState({ data: {}, step: 0 });
    localStorage.removeItem(storageKey);
    localStorage.removeItem(`${storageKey}_step`);
  };

  if (!isHydrated) {
    return null;
  }

  return (
    <MultiStepContext.Provider
      value={{
        formData: state.data,
        reachedStep: state.step,
        saveStepData,
        clearAllData,
      }}
    >
      {children}
    </MultiStepContext.Provider>
  );
};

export const useFormContext = () => {
  const context = useContext(MultiStepContext);
  if (!context) {
    throw new Error(
      'useFormContext harus digunakan di dalam MultiStepProvider'
    );
  }
  return context;
};
