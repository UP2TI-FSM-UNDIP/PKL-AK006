import React from "react";
import { ChevronDown, LucideIcon } from "lucide-react";

export interface InfoField {
    label: string;
    value: string;
    icon: LucideIcon;
    fullWidth?: boolean;
}

interface InfoCardProps {
    title: string;
    titleIcon: LucideIcon;
    titleIconColorClass: string; // e.g. "text-blue-600 bg-blue-50 dark:bg-blue-900/20"
    fields: InfoField[];
    isOpen: boolean;
    onToggle: () => void;
}

export function InfoCard({
    title,
    titleIcon: Icon,
    titleIconColorClass,
    fields,
    isOpen,
    onToggle
}: InfoCardProps) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all duration-300 overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${titleIconColorClass}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
                </div>
                <ChevronDown
                    className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {isOpen && (
                <div className="px-6 pb-6 pt-0 animate-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                        {fields.map((field, index) => (
                            <div
                                key={index}
                                className={`${field.fullWidth ? 'md:col-span-2' : ''}`}
                            >
                                <div className={`flex items-center gap-2 mb-1.5 text-gray-500 dark:text-gray-400 transition-colors`}>
                                    <field.icon className="w-3.5 h-3.5" />
                                    <span className="text-xs font-medium uppercase tracking-wider">{field.label}</span>
                                </div>
                                <div className="text-gray-900 dark:text-white font-medium pl-0.5 break-words">
                                    {field.value}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
