"use client";

import React, { useState, useEffect, useRef } from "react";
import { Eye, ChevronDown } from "lucide-react";
import { AK006LetterTemplate } from "@/components/templates/AK006LetterTemplate";
import { type LetterInstance } from "@/lib/api";

interface LetterPreviewCardProps {
    letter: LetterInstance | null;
    templateData: any;
    templateConfig?: any;
    isOpen?: boolean;
    onToggle?: () => void;
    title?: string;
    letterNumber?: string;
    letterDate?: string | Date;
    signatureUrl?: string;
}

export function LetterPreviewCard({
    letter,
    templateData,
    templateConfig,
    isOpen = true,
    onToggle,
    title = "Pratinjau Surat",
    letterNumber,
    letterDate,
    signatureUrl
}: LetterPreviewCardProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(0);

    // Measure container width for responsive scaling
    useEffect(() => {
        const updateWidth = () => {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.clientWidth);
            }
        };
        updateWidth();
        window.addEventListener('resize', updateWidth);
        return () => window.removeEventListener('resize', updateWidth);
    }, [isOpen]);

    // A4 dimensions in pixels (210mm ≈ 793px, 297mm ≈ 1122px)
    const A4_WIDTH = 793;
    const A4_HEIGHT = 1122;

    // Calculate scale factor to fit A4 width into container
    const scale = containerWidth > 0 ? Math.min(1, (containerWidth - 32) / A4_WIDTH) : 0.5;
    const visualWidth = A4_WIDTH * scale;
    const visualHeight = A4_HEIGHT * scale;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all duration-300 overflow-hidden mb-6">
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg text-blue-600 bg-blue-50 dark:bg-blue-900/20">
                        <Eye className="w-5 h-5" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
                </div>
                {onToggle && (
                    <ChevronDown
                        className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    />
                )}
            </button>

            {isOpen && (
                <div className="px-6 pb-6 pt-0 animate-in slide-in-from-top-2 duration-200">
                    <div
                        ref={containerRef}
                        className="bg-[#F8FAFC] dark:bg-gray-900/50 rounded-lg p-4 border border-gray-100 dark:border-gray-700 flex justify-center overflow-hidden min-h-[300px]"
                    >
                        {containerWidth > 0 && (
                            <div style={{
                                width: `${visualWidth}px`,
                                height: `${visualHeight}px`,
                                position: 'relative',
                            }}>
                                <div
                                    className="bg-white shadow-xl origin-top-left"
                                    style={{
                                        width: `${A4_WIDTH}px`,
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        transform: `scale(${scale})`,
                                    }}
                                >
                                    <AK006LetterTemplate
                                        data={templateData}
                                        signatureUrl={signatureUrl || letter?.signatureUrl}
                                        letterNumber={letterNumber !== undefined ? letterNumber : (letter?.letterNumber || '')}
                                        letterDate={letterDate !== undefined ? (typeof letterDate === 'string' ? letterDate : letterDate.toISOString()) : (letter?.archivedAt || letter?.updatedAt || letter?.createdAt)}
                                        letterId={letter?.id}
                                        status={letter?.status}
                                        templateConfig={templateConfig}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
