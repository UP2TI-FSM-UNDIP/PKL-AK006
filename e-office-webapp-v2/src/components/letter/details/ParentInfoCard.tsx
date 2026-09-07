import React from "react";
import {
    Users,
    Briefcase,
    Building,
    BadgeCheck
} from "lucide-react";
import { InfoCard, InfoField } from "./InfoCard";

interface ParentInfoCardProps {
    data: {
        nama: string;
        nipPensiun: string;
        pangkatGolongan: string;
        instansi: string;
    };
    isOpen: boolean;
    onToggle: () => void;
}

export function ParentInfoCard({ data, isOpen, onToggle }: ParentInfoCardProps) {
    const fields: InfoField[] = [
        { label: "Nama Orang Tua / Wali", value: data.nama, icon: Users, fullWidth: true },
        { label: "NIP / Pensiunan", value: data.nipPensiun, icon: BadgeCheck },
        { label: "Pangkat / Golongan", value: data.pangkatGolongan, icon: Briefcase },
        { label: "Instansi", value: data.instansi, icon: Building, fullWidth: true },
    ];

    return (
        <InfoCard
            title="Data Orang Tua / Wali"
            titleIcon={Users}
            titleIconColorClass="text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20"
            fields={fields}
            isOpen={isOpen}
            onToggle={onToggle}
        />
    );
}
