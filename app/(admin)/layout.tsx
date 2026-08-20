"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SidebarAdmin from "@/components/SidebarAdmin";
import Logo from "@/components/Logo";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const admin = localStorage.getItem("admin");
    if (!token || !admin) {
      router.replace("/admin");
    } else {
      setAuthorized(true);
    }
  }, [router]);

  if (!authorized) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-500 text-xs">
        <span className="material-symbols-outlined text-3xl animate-spin text-primary mb-2">
          sync
        </span>
        Cargando panel de administración...
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarAdmin isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar with hamburger */}
        <header className="md:hidden h-14 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 bg-white/50 dark:bg-background-dark/50 backdrop-blur-md sticky top-0 z-10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-slate-400 hover:text-primary rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="text-primary flex items-center justify-center">
              <Logo className="w-5 h-5 drop-shadow-sm" />
            </div>
            <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">
              THUNDER<span className="text-primary">REHAB</span>
            </span>
          </div>
          <div className="w-10" /> {/* Spacer for centering */}
        </header>

        <main className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark">
          {children}
        </main>
      </div>
    </div>
  );
}
