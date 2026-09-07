'use client';
import { useEffect, useState, useRef } from 'react';
import {
  formatBytes,
  useFileUpload,
  type FileMetadata,
  type FileWithPreview,
} from '@/hooks/use-file-upload';
import {
  Alert,
  AlertContent,
  AlertDescription,
  AlertIcon,
  AlertTitle,
} from '@/components/ui/Alert';
import { TriangleAlert, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import UploadList from '@/components/ui/UploadList';
import { letterApi } from '@/lib/api';
import { sanitizeFileUrl } from '@/lib/helpers';

interface FileUploadItem extends FileWithPreview {
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
  selectedOption?: string;
  uploadedData?: {
    url: string;
    filename: string;
    originalName: string;
    mimeType?: string;
    size?: number;
  };
}

export interface DynamicFormField {
  label: string;
  datatype: string;
  value: string;
  validation: string;
  metadata: {
    id: string;
    status: 'uploading' | 'completed' | 'error';
    size: number;
    file?: File; // Store the actual file object
    uploadedData?: {
      url: string;
      filename: string;
      originalName: string;
      mimeType?: string;
      size?: number;
    };
  };
}

// Helper untuk membuat objek File tiruan dari metadata
const createMockFile = (metadata: {
  name: string;
  size: number;
}): File => {
  return new File([], metadata.name, {
    type: 'application/octet-stream',
    lastModified: Date.now(),
  });
};

interface CardUploadProps {
  maxFiles?: number;
  maxSize?: number;
  accept?: string;
  multiple?: boolean;
  className?: string;
  dropdownOptions?: string[];
  simulateUpload?: boolean;
  onFilesChange?: (fields: DynamicFormField[]) => void; // MODIFIED
  initialFields?: DynamicFormField[];
  isMandatory?: boolean;
  uploadImmediately?: boolean; // NEW: Upload to MinIO immediately
  uploadCategory?: string; // NEW: Category for MinIO (e.g., 'lampiran/')
}

export default function CardUpload({
  maxFiles = 5,
  maxSize = 5 * 1024 * 1024,
  accept = '.pdf, .jpg, .png',
  multiple = true,
  className,
  onFilesChange,
  simulateUpload = true,
  dropdownOptions = [],
  initialFields,
  isMandatory = false,
  uploadImmediately = true, // Default to upload immediately
  uploadCategory = 'lampiran/',
}: CardUploadProps) {
  const [uploadFiles, setUploadFiles] = useState<FileUploadItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const prevInitialFieldsRef = useRef<DynamicFormField[] | undefined>(undefined);

  const [customError, setCustomError] = useState<string | null>(null);

  useEffect(() => {
    // Only update if initialFields actually changed
    const fieldsChanged = JSON.stringify(initialFields?.map(f => f.metadata.id)) !==
      JSON.stringify(prevInitialFieldsRef.current?.map(f => f.metadata.id));

    if (!fieldsChanged && isInitialized) {
      console.log('=== CardUpload: Fields unchanged, skipping re-init ===');
      return;
    }

    prevInitialFieldsRef.current = initialFields;

    if (initialFields && initialFields.length > 0) {
      console.log('=== CardUpload: Initializing from initialFields ===');
      console.log('Initial Fields:', initialFields);

      const allFiles: FileUploadItem[] = initialFields
        .filter((field) => field.value)
        .map((field) => {
          const fileObj =
            field.metadata.file instanceof File
              ? field.metadata.file
              : createMockFile({
                name: field.value,
                size: field.metadata.size || field.metadata.uploadedData?.size || 0,
              });

          // Buat preview URL jika file tersedia
          let previewUrl = sanitizeFileUrl(field.metadata.uploadedData?.url);
          if (field.metadata.file instanceof File) {
            previewUrl = URL.createObjectURL(field.metadata.file);
          }

          console.log(`File ${field.label}:`, {
            hasFile: field.metadata.file instanceof File,
            hasUploadedData: !!field.metadata.uploadedData,
            uploadedUrl: field.metadata.uploadedData?.url,
            previewUrl: previewUrl,
          });

          return {
            file: fileObj,
            id: field.metadata.id,
            progress: 100,
            status: 'completed' as const,
            selectedOption: field.label,
            uploadedData: field.metadata.uploadedData,
            preview: previewUrl,
          };
        });

      console.log('Mapped Upload Files:', allFiles);
      setUploadFiles(allFiles);
      setIsInitialized(true);
    } else if (initialFields?.length === 0 && isInitialized && uploadFiles.length > 0) {
      // If initialFields becomes empty, clear uploadFiles (only if not already empty)
      setUploadFiles([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFields]);

  // Cleanup Object URLs only on unmount
  const filesToCleanupRef = useRef<FileUploadItem[]>([]);
  useEffect(() => {
    filesToCleanupRef.current = uploadFiles;
  }, [uploadFiles]);

  useEffect(() => {
    return () => {
      filesToCleanupRef.current.forEach((file) => {
        if (file.preview && file.file instanceof File) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, []);

  const onFilesChangeRef = useRef(onFilesChange);
  useEffect(() => {
    onFilesChangeRef.current = onFilesChange;
  }, [onFilesChange]);

  const lastSerializedData = useRef<string>('');

  useEffect(() => {
    // --- PROSES TRANSFORMASI ---
    const attachmentFields: DynamicFormField[] = uploadFiles.map((item) => {
      const fieldLabel =
        item.selectedOption ||
        (isMandatory ? 'pending_selection' : item.file.name);

      return {
        label: fieldLabel,
        datatype: 'file',
        value: item.status === 'completed' ? item.file.name : '',
        validation: isMandatory ? 'REQUIRED' : 'OPTIONAL',
        metadata: {
          id: item.id,
          status: item.status,
          size: item.file.size,
          file: item.file instanceof File ? item.file : undefined,
          uploadedData: item.uploadedData,
        },
      };
    });

    const currentSerialized = JSON.stringify(
      attachmentFields.map((f) => ({
        ...f,
        metadata: { ...f.metadata, file: undefined },
      }))
    );

    if (currentSerialized !== lastSerializedData.current) {
      lastSerializedData.current = currentSerialized;
      console.log('CardUpload: Sending fields to parent', { attachmentFields });
      onFilesChangeRef.current?.(attachmentFields);
    }
  }, [uploadFiles, isMandatory]);

  const [
    { isDragging, errors },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      getInputProps,
      removeFile, // Destructure removeFile
    },
  ] = useFileUpload({
    maxFiles,
    maxSize,
    accept,
    multiple,
    initialFiles: [], // <--- KOSONGKAN, SUDAH DIHANDLE DI EFEK ATAS
    onFilesAdded: (addedFiles) => {
      const currentFiles = filesRef.current;

      // Validation: Check maxFiles
      if (currentFiles.length >= maxFiles) {
        setCustomError(`Maksimal ${maxFiles} file diizinkan.`);
        return;
      }

      setCustomError(null);

      const selectedOptionsInPrev = new Set(
        currentFiles.map((f) => f.selectedOption).filter(Boolean)
      );

      const newItems = addedFiles.map((file) => {
        const lowerName = file.file.name.toLowerCase();
        let autoSelectedOption: string | undefined;

        // Auto-assign logic based on filename keywords
        if (lowerName.includes('ktm')) {
          autoSelectedOption = dropdownOptions.find(opt => opt.toUpperCase() === 'KTM');
        } else if (lowerName.includes('krs') || lowerName.includes('irs')) {
          autoSelectedOption = dropdownOptions.find(opt => opt.toUpperCase() === 'KRS');
        }

        // Only use auto-selected if it's not already taken
        if (autoSelectedOption && selectedOptionsInPrev.has(autoSelectedOption)) {
          autoSelectedOption = undefined;
        }

        // Fallback to first available if no auto-selection
        const finalOption = autoSelectedOption || dropdownOptions.find(
          (opt) => !selectedOptionsInPrev.has(opt)
        );

        if (finalOption) {
          selectedOptionsInPrev.add(finalOption);
        }

        return {
          ...file,
          progress: uploadImmediately ? 0 : 100,
          status: (uploadImmediately ? 'uploading' : 'completed') as 'uploading' | 'completed',
          selectedOption: finalOption,
        };
      });

      // Prevent duplicates
      const uniqueNewItems = newItems.filter(newItem =>
        !currentFiles.some(existing =>
          existing.file.name === newItem.file.name &&
          existing.file.size === newItem.file.size
        )
      );

      // Enforce maxFiles on the new items
      const remainingSlots = maxFiles - currentFiles.length;
      const itemsToAdd = uniqueNewItems.slice(0, remainingSlots);

      if (uniqueNewItems.length > remainingSlots) {
        setCustomError(`Beberapa file tidak ditambahkan karena melebihi batas maksimal ${maxFiles} file.`);
      }

      if (itemsToAdd.length > 0) {
        setUploadFiles((prev) => [...prev, ...itemsToAdd]);
      }
    },
  });

  const filesRef = useRef(uploadFiles);
  useEffect(() => {
    filesRef.current = uploadFiles;
  }, [uploadFiles]);

  // Track files currently being uploaded to prevent duplicates
  const uploadingInProgressRef = useRef<Set<string>>(new Set());

  // Upload file to MinIO
  const uploadToMinIO = async (fileItem: FileUploadItem): Promise<FileUploadItem> => {
    if (!(fileItem.file instanceof File)) {
      return { ...fileItem, status: 'error', error: 'Invalid file object' };
    }

    try {
      const res = await letterApi.uploadFile(fileItem.file, uploadCategory);
      if (res.success && res.data) {
        return {
          ...fileItem,
          progress: 100,
          status: 'completed',
          uploadedData: res.data,
        };
      } else {
        return {
          ...fileItem,
          status: 'error',
          error: res.message || 'Upload failed',
        };
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      return {
        ...fileItem,
        status: 'error',
        error: err.message || 'Upload failed',
      };
    }
  };

  useEffect(() => {
    if (!simulateUpload && uploadImmediately) {
      // Find files that need uploading (status uploading, no data, not already in progress)
      const uploadingFiles = filesRef.current.filter(
        (file) =>
          file.status === 'uploading' &&
          !file.uploadedData &&
          !uploadingInProgressRef.current.has(file.id)
      );

      if (uploadingFiles.length === 0) return;

      // Upload each file
      uploadingFiles.forEach(async (fileItem) => {
        if (!(fileItem.file instanceof File)) return;

        // Mark as in progress to prevent re-triggering
        uploadingInProgressRef.current.add(fileItem.id);

        const result = await uploadToMinIO(fileItem);

        // Remove from in-progress tracking
        uploadingInProgressRef.current.delete(fileItem.id);

        setUploadFiles((prev) =>
          prev.map((f) => (f.id === fileItem.id ? result : f))
        );
      });
    } else if (simulateUpload) {
      const uploadingFiles = filesRef.current.filter(
        (file) => file.status === 'uploading'
      );

      if (uploadingFiles.length === 0) return;

      const interval = setInterval(() => {
        setUploadFiles((prev) =>
          prev.map((file) => {
            if (file.status !== 'uploading') return file;

            const increment = Math.random() * 20 + 5;
            const newProgress = Math.min(file.progress + increment, 100);

            if (newProgress >= 100) {
              const shouldFail = Math.random() < 0.1;
              return {
                ...file,
                progress: 100,
                status: shouldFail ? 'error' : 'completed',
                error: shouldFail
                  ? 'Upload failed. Please try again.'
                  : undefined,
              };
            }

            return { ...file, progress: newProgress };
          })
        );
      }, 500);

      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadFiles, simulateUpload, uploadImmediately, uploadCategory]);

  const handleOptionChange = (fileId: string, newOption: string) => {
    setUploadFiles((prevFiles) => {
      const newFiles = [...prevFiles];
      const fileToUpdateIndex = newFiles.findIndex((f) => f.id === fileId);
      if (fileToUpdateIndex === -1) return prevFiles;

      const fileToUpdate = newFiles[fileToUpdateIndex];
      const oldOption = fileToUpdate.selectedOption;

      // Cari file lain yang sudah pakai newOption
      const otherFileIndex = newFiles.findIndex(
        (f, idx) => idx !== fileToUpdateIndex && f.selectedOption === newOption
      );

      // Jika ada file lain yang pakai newOption, swap selectedOption
      if (otherFileIndex !== -1) {
        const otherFile = newFiles[otherFileIndex];
        newFiles[otherFileIndex] = { ...otherFile, selectedOption: oldOption };
      }

      // Update file yang diedit ke newOption
      newFiles[fileToUpdateIndex] = {
        ...fileToUpdate,
        selectedOption: newOption,
      };
      console.log('Updated files after option change:', newFiles);
      return newFiles;
    });
  };

  const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

  const getFileIcon = (file: File | FileMetadata) => {
    const type = file instanceof File ? file.type : file.type;
    if (type.startsWith('image/'))
      return (
        <img
          src={`${BASE_PATH}/icon/Picture.svg`}
          width={40}
          height={40}
          alt='Image Icon'
        />
      );
    if (type.includes('pdf'))
      return (
        <img src={`${BASE_PATH}/icon/PDF.svg`} width={40} height={40} alt='PDF Icon' />
      );
  };

  return (
    <div className={cn('w-full space-y-4', className)}>
      <div
        className={cn(
          'relative rounded-lg border border-dashed p-6 text-center transition-colors',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input {...getInputProps()} className='sr-only' />
        <div className='flex flex-col items-center gap-4'>
          <div
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-full bg-muted',
              isDragging && 'bg-primary/10'
            )}
          >
            <Upload className='h-5 w-5 text-muted-foreground' />
          </div>
          <div className='space-y-2'>
            <p className='text-sm font-medium'>
              Seret & lepas atau{' '}
              <button
                type='button'
                onClick={openFileDialog}
                className='cursor-pointer underline-offset-4 hover:underline text-blue-400'
              >
                pilih file
              </button>
            </p>
            <p className='text-xs text-muted-foreground'>untuk diunggah</p>
          </div>
        </div>
      </div>

      <div className='space-y-3'>
        {uploadFiles.map((file) => (
          <UploadList
            key={file.id}
            icon={getFileIcon(file.file)}
            fileName={file.file.name}
            fileSize={formatBytes(file.file.size)}
            dropdownOptions={dropdownOptions}
            selectedOption={file.selectedOption}
            onOptionChange={(newOption) => {
              if (newOption) {
                handleOptionChange(file.id, newOption);
              }
            }}
            onView={() => {
              let viewUrl = file.preview || sanitizeFileUrl(file.uploadedData?.url);

              // Add query parameter to force inline display instead of download
              if (viewUrl && !file.preview) {
                try {
                  const url = new URL(viewUrl);
                  url.searchParams.set('response-content-disposition', 'inline');
                  viewUrl = url.toString();
                } catch (e) {
                  console.warn('Failed to parse URL:', viewUrl);
                }
              }

              if (viewUrl) {
                window.open(viewUrl, '_blank', 'noopener,noreferrer');
              }
            }}
            onDelete={() => {
              if (confirm('Apakah Anda yakin ingin menghapus file ini?')) {
                console.log('=== CardUpload: Deleting file ===');
                console.log('File ID to delete:', file.id);
                console.log('File label:', file.selectedOption);
                console.log('Current uploadFiles count:', uploadFiles.length);

                // Revoke Object URL jika ada dan file adalah File object
                if (file.preview && file.file instanceof File) {
                  URL.revokeObjectURL(file.preview);
                }

                // Filter out the deleted file
                setUploadFiles((prev) => {
                  const newFiles = prev.filter((f) => f.id !== file.id);
                  console.log('New uploadFiles count after delete:', newFiles.length);
                  console.log('Remaining files:', newFiles.map(f => ({ id: f.id, label: f.selectedOption })));
                  return newFiles;
                });

                removeFile(file.id); // Also remove from the hook
              }
            }}
          />
        ))}
      </div>

      {(errors.length > 0 || customError) && (
        <Alert variant='destructive' appearance='light' className='mt-5'>
          <AlertIcon>
            <TriangleAlert />
          </AlertIcon>
          <AlertContent>
            <AlertTitle>File upload error(s)</AlertTitle>
            <AlertDescription>
              {errors.map((error, index) => (
                <p key={index}>{error}</p>
              ))}
              {customError && <p>{customError}</p>}
            </AlertDescription>
          </AlertContent>
        </Alert>
      )}
    </div>
  );
}
