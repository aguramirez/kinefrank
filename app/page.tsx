"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";

export default function PacienteLoginPage() {
  const router = useRouter();
  const [dni, setDni] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const [focusedInput, setFocusedInput] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // Try paciente login first
      const res = await fetch("/api/auth/paciente/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dni }),
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("paciente", JSON.stringify(data.paciente));
        localStorage.setItem("userRole", "paciente");
        router.push("/home");
        return;
      }

      // If paciente not found (404), try alumno
      if (res.status === 404) {
        const resAlumno = await fetch("/api/auth/alumno/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dni }),
        });
        const dataAlumno = await resAlumno.json();

        if (resAlumno.ok) {
          localStorage.setItem("token", dataAlumno.token);
          localStorage.setItem("alumno", JSON.stringify(dataAlumno.alumno));
          localStorage.setItem("userRole", "alumno");
          router.push("/home");
          return;
        }

        // If alumno also not found, show generic error
        if (resAlumno.status === 404) {
          setError("DNI no encontrado en el sistema");
          return;
        }

        setError(dataAlumno.error || "Error al iniciar sesión");
        return;
      }

      setError(data.error || "Error al iniciar sesión");
    } catch {
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background-dark px-5 relative overflow-hidden">
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large gradient orb */}
        <div 
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-[120px] transition-all duration-[2000ms]"
          style={{ 
            background: 'radial-gradient(circle, rgba(250,215,0,0.15) 0%, transparent 70%)',
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'scale(1)' : 'scale(0.5)',
          }}
        />
        {/* Bottom orb */}
        <div 
          className="absolute -bottom-48 -left-24 w-80 h-80 rounded-full blur-[100px] transition-all duration-[2500ms] delay-300"
          style={{ 
            background: 'radial-gradient(circle, rgba(250,215,0,0.08) 0%, transparent 70%)',
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'scale(1)' : 'scale(0.5)',
          }}
        />
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 transition-opacity duration-[2000ms] delay-500"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            opacity: mounted ? 1 : 0,
          }}
        />
      </div>

      {/* Content */}
      <div 
        className="relative z-10 w-full max-w-sm flex flex-col items-center transition-all duration-700"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(30px)',
        }}
      >
        {/* Logo Icon */}
        <div className="mb-6 relative">
          <div className="w-24 h-24 flex items-center justify-center">
            <Logo className="w-full h-full text-primary drop-shadow-2xl" />
          </div>
          {/* Glow ring */}
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl -z-10 animate-pulse" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-black text-white tracking-tight mb-1 text-center">
          THUNDER <span className="text-primary">REHAB</span>
        </h1>
        <p className="text-slate-500 text-sm mb-10 text-center">
          Lic. Franco Henriquez
        </p>

        {/* Login Card */}
        <div 
          className="w-full bg-card-dark/80 backdrop-blur-xl rounded-3xl border border-slate-800/80 shadow-2xl shadow-black/40 overflow-hidden transition-all duration-500"
          style={{
            borderColor: focusedInput ? 'rgba(250,215,0,0.3)' : 'rgba(30,41,59,0.8)',
          }}
        >
          {/* Card Header */}
          <div className="px-6 pt-7 pb-4">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-lg">waving_hand</span>
              </div>
              <h2 className="text-lg font-bold text-white">¡Bienvenido!</h2>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="px-6 pb-7">
            {/* Error */}
            {error && (
              <div className="mb-4 p-3.5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-medium flex items-center gap-2.5 animate-[shake_0.3s_ease-in-out]">
                <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-red-400 text-lg">error</span>
                </div>
                <span>{error}</span>
              </div>
            )}

            {/* DNI Input */}
            <div className="mb-5">
              <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2.5 pl-1">
                DNI
              </label>
              <div className="relative group">
                <span 
                  className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-lg transition-colors duration-300"
                  style={{ color: focusedInput ? '#FAD700' : '#64748b' }}
                >
                  badge
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                  onFocus={() => setFocusedInput(true)}
                  onBlur={() => setFocusedInput(false)}
                  placeholder="Ej: 99888777"
                  className="w-full pl-12 pr-4 py-4 bg-white/[0.03] border border-slate-700/50 rounded-2xl text-white text-sm font-medium focus:ring-2 focus:ring-primary/40 focus:border-primary/50 outline-none transition-all duration-300 placeholder:text-slate-600 hover:border-slate-600"
                  required
                />
                {/* Animated underline glow */}
                <div 
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] bg-primary rounded-full transition-all duration-500"
                  style={{ width: focusedInput ? '80%' : '0%' }}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !dni}
              className="w-full py-4 bg-gradient-to-r from-primary to-orange-600 hover:from-primary hover:to-orange-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2.5 shadow-xl shadow-primary/25 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] text-sm"
            >
              {loading ? (
                <>
                  <Logo animate className="w-6 h-6 text-current drop-shadow-md" />
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <span>Acceder a mi Rutina</span>
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </>
              )}
            </button>

            {/* Helper text */}
            <p className="text-center text-xs text-slate-600 mt-4 leading-relaxed">
              Ingresá el DNI que tu kinesiólogo registró<br/>al darte de alta en el sistema
            </p>
          </form>
        </div>

        {/* Admin link */}
        {/* <Link 
          href="/admin"
          className="mt-8 flex items-center gap-2 text-xs text-slate-600 hover:text-primary transition-colors duration-300 group"
        >
          <span className="material-symbols-outlined text-sm group-hover:text-primary transition-colors">admin_panel_settings</span>
          <span>Acceso Administrador</span>
          <span className="material-symbols-outlined text-sm opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">chevron_right</span>
        </Link> */}

        {/* Footer */}
        <p className="text-center text-[10px] text-slate-700 mt-6 tracking-wide">
          THUNDER REHABILITACIÓN © 2026
        </p>
      </div>

      {/* Shake animation for errors */}
      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}
