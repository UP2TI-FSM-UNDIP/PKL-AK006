import React from "react";
import {
    FileText,
    HelpCircle,
    Calendar,
    BookOpen
} from "lucide-react";
import { InfoCard, InfoField } from "./InfoCard";

interface LetterDetailsCardProps {
    data: {
        jenisSurat: string;
        keperluan: string;
        semester: string;
        tahunAkademik: string;
    };
    isOpen: boolean;
    onToggle: () => void;
}

export function LetterDetailsCard({ data, isOpen, onToggle }: LetterDetailsCardProps) {
    const fields: InfoField[] = [
        { label: "Jenis Surat", value: data.jenisSurat, icon: FileText, fullWidth: true },
        { label: "Keperluan", value: data.keperluan, icon: HelpCircle, fullWidth: true },
        { label: "Semester", value: data.semester, icon: BookOpen },
        { label: "Tahun Akademik", value: data.tahunAkademik, icon: Calendar },
    ];

    return (
        <InfoCard
            title="Detail Surat Pengajuan"
            titleIcon={FileText}
            titleIconColorClass="text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20"
            fields={fields}
            isOpen={isOpen}
            onToggle={onToggle}
        />
    );
}
