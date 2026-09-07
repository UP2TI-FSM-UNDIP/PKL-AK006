// AttachmentList component for displaying letter attachments
import React from 'react';
import { FileText, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { sanitizeFileUrl } from '@/lib/helpers';
import type { LetterAttachment } from '@/lib/api';

interface AttachmentListProps {
    attachments?: LetterAttachment[];
}

function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function AttachmentList({ attachments }: AttachmentListProps) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 transition-colors duration-300">
            <h2 className="text-lg font-semibold mb-4 dark:text-white">Lampiran</h2>
            {(!attachments || attachments.length === 0) ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Tidak ada lampiran</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {attachments.map((attachment, index) => {
                        const isImage = attachment.mimeType?.startsWith('image/');
                        const isPDF = attachment.mimeType === 'application/pdf';
                        const fileSize = attachment.size ? formatFileSize(attachment.size) : '';

                        return (
                            <div
                                key={attachment.id || index}
                                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-300 dark:hover:border-blue-600 transition-colors bg-white dark:bg-gray-700"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${isPDF
                                                ? 'bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400'
                                                : isImage
                                                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400'
                                                    : 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                                }`}
                                        >
                                            {isImage ? (
                                                <ImageIcon className="w-5 h-5" />
                                            ) : (
                                                <FileText className="w-5 h-5" />
                                            )}
                                        </div>
                                        <div>
                                            <p
                                                className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[200px]"
                                                title={attachment.originalName}
                                            >
                                                {attachment.originalName || attachment.filename}
                                            </p>
                                            {fileSize && <p className="text-xs text-gray-500 dark:text-gray-400">{fileSize}</p>}
                                        </div>
                                    </div>
                                    <a
                                        href={sanitizeFileUrl(attachment.url)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        <span>Lihat</span>
                                    </a>
                                </div>
                                {/* Preview for images */}
                                {isImage && (
                                    <div className="mt-3 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700">
                                        <img
                                            src={sanitizeFileUrl(attachment.url)}
                                            alt={attachment.originalName}
                                            className="w-full max-h-48 object-contain bg-gray-50 dark:bg-gray-900"
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

