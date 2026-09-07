import React from "react";
import {
    User,
    CreditCard,
    Mail,
    Building2,
    GraduationCap,
    MapPin,
    Calendar,
    Phone,
    Map
} from "lucide-react";
import { InfoCard, InfoField } from "./InfoCard";

interface ApplicantInfoCardProps {
    data: {
        namaLengkap: string;
        nim: string;
        email: string;
        departemen: string;
        programStudi: string;
        tempatLahir: string;
        tanggalLahir: string;
        noHP: string;
        alamat: string;
        role?: string; // Optional role for other views
    };
    isOpen: boolean;
    onToggle: () => void;
}

export function ApplicantInfoCard({ data, isOpen, onToggle }: ApplicantInfoCardProps) {
    const fields: InfoField[] = [
        { label: "Nama Lengkap", value: data.namaLengkap, icon: User },
        ...(data.role ? [{ label: "Role", value: data.role, icon: User }] : []),
        { label: "NIM/NIDN", value: data.nim, icon: CreditCard },
        { label: "Email", value: data.email, icon: Mail },
        { label: "Departemen", value: data.departemen, icon: Building2 },
        { label: "Program Studi", value: data.programStudi, icon: GraduationCap },
        { label: "Tempat Lahir", value: data.tempatLahir, icon: MapPin },
        { label: "Tanggal Lahir", value: data.tanggalLahir, icon: Calendar },
        { label: "No. HP", value: data.noHP, icon: Phone },
        { label: "Alamat", value: data.alamat, icon: Map, fullWidth: true },
    ];

    return (
        <InfoCard
            title="Identitas Pengaju"
            titleIcon={User}
            titleIconColorClass="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
            fields={fields}
            isOpen={isOpen}
            onToggle={onToggle}
        />
    );
}
