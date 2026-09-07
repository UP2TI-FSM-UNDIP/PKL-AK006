"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  ShieldCheck, 
  Settings,
  ChevronDown,
  ChevronRight,
  X
} from "lucide-react";

interface SuperadminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const menuItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/superadmin/dashboard",
  },
  {
    id: "letters",
    label: "Semua Surat",
    icon: FileText,
    path: "/superadmin/letters",
    subItems: [
      { label: "Daftar Surat", path: "/superadmin/letters" },
      { label: "Template AK006", path: "/superadmin/letters/templates" },
    ],
  },
  {
    id: "users",
    label: "Manajemen Pengguna",
    icon: Users,
    path: "/superadmin/users",
    subItems: [
      { label: "Daftar Pengguna", path: "/superadmin/users" },
      { label: "Mahasiswa", path: "/superadmin/users?type=mahasiswa" },
      { label: "Pegawai", path: "/superadmin/users?type=pegawai" },
    ],
  },
  {
    id: "roles",
    label: "Manajemen Role",
    icon: ShieldCheck,
    path: "/superadmin/roles",
  },
  {
    id: "settings",
    label: "Pengaturan",
    icon: Settings,
    path: "/superadmin/settings",
  },
];

export function SuperadminSidebar({ isOpen = false, onClose }: SuperadminSidebarProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>(["letters", "users"]);
  const pathname = usePathname();

  const toggleExpand = (itemId: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleNavigation = (path: string) => {
    const base = process.env.NEXT_PUBLIC_BASE_PATH || '';
    window.location.href = `${base}${path}`;
    if (onClose) onClose();
  };

  const isActive = (path: string) => {
    if (path.includes("?")) {
      return pathname === path.split("?")[0];
    }
    return pathname === path || pathname.startsWith(path + "/");
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose) onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Lock body scroll when open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky lg:top-16 inset-y-0 left-0
          w-[280px]
          bg-white dark:bg-gray-800 flex flex-col text-gray-700 dark:text-gray-300 
          border-r border-gray-200 dark:border-gray-700 
          transform transition-all duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          z-50 lg:z-40
          min-h-screen lg:h-[calc(100vh-64px)]
          overflow-y-auto
          pt-14 sm:pt-16 lg:pt-0
        `}
      >
        {/* Mobile close button */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <span className="font-semibold text-lg text-gray-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-600" />
            Superadmin
          </span>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Header - Desktop */}
        <div className="hidden lg:flex items-center gap-3 px-4 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <ShieldCheck className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">Superadmin</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">System Administrator</p>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 py-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isExpanded = expandedItems.includes(item.id);
            const active = isActive(item.path);

            return (
              <div key={item.id}>
                <button
                  className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                    active
                      ? "bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-r-4 border-purple-600"
                      : "hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                  onClick={() => {
                    if (hasSubItems) {
                      toggleExpand(item.id);
                    } else {
                      handleNavigation(item.path);
                    }
                  }}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    <span className="font-medium text-sm">{item.label}</span>
                  </span>
                  {hasSubItems && (
                    isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )
                  )}
                </button>

                {/* Submenu */}
                {hasSubItems && isExpanded && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 pl-12 pr-4 py-2 space-y-1">
                    {item.subItems!.map((subItem) => (
                      <div
                        key={subItem.path}
                        className={`py-2 px-3 cursor-pointer rounded-md transition-colors text-sm ${
                          pathname === subItem.path.split("?")[0]
                            ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400"
                            : "text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-700 dark:hover:text-purple-400"
                        }`}
                        onClick={() => handleNavigation(subItem.path)}
                      >
                        {subItem.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <p className="text-xs text-purple-700 dark:text-purple-400 font-medium">
              Akses Penuh Sistem
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Anda memiliki akses ke semua fitur dan data sistem.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}

export default SuperadminSidebar;
