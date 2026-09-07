"use client";
import { useState, ReactNode } from "react";
import { AppSidebar } from "./SideBar";
import TopBar from "./TopBar";

type SidebarRole = "manajer-tu" | "supervisor-akademik" | "upa";

interface ResponsiveLayoutProps {
    children: ReactNode;
    role: SidebarRole;
    topBarRole?: string;
}

export function ResponsiveLayout({ children, role, topBarRole }: ResponsiveLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const roleDisplayNames: Record<SidebarRole, string> = {
        "manajer-tu": "Manajer TU",
        "supervisor-akademik": "Supervisor Akademik",
        "upa": "UPA",
    };

    return (
        <div className="min-h-screen flex flex-col">
            <TopBar
                role={topBarRole || roleDisplayNames[role]}
                onMenuClick={() => setSidebarOpen(true)}
            />
            <div className="flex flex-1 bg-[#F3F3F3] relative">
                <AppSidebar
                    role={role}
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                />
                <main className="flex-1 w-full min-w-0">
                    {children}
                </main>
            </div>
        </div>
    );
}
