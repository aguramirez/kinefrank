"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al iniciar sesión");
        return;
      }
      // Guardar token en localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("admin", JSON.stringify(data.admin));
      router.push("/dashboard");
    } catch {
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background-dark px-5 relative overflow-hidden">
      
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Top-left gradient */}
        <div 
          className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full blur-[140px] transition-all duration-[2000ms]"
          style={{ 
            background: 'radial-gradient(circle, rgba(250,215,0,0.12) 0%, transparent 70%)',
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'scale(1)' : 'scale(0.5)',
          }}
        />
        {/* Bottom-right gradient */}
        <div 
          className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-[100px] transition-all duration-[2500ms] delay-300"
          style={{ 
            background: 'radial-gradient(circle, rgba(250,215,0,0.1) 0%, transparent 70%)',
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'scale(1)' : 'scale(0.5)',
          }}
        />
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 transition-opacity duration-[2000ms] delay-500"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            opacity: mounted ? 1 : 0,
          }}
        />
        {/* Diagonal accent lines */}
        <div 
          className="absolute top-0 right-0 w-full h-full transition-opacity duration-[3000ms] delay-700"
          style={{
            background: 'linear-gradient(135deg, rgba(250,215,0,0.03) 0%, transparent 40%)',
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
        {/* Back to patient login */}
        {/* <Link 
          href="/"
          className="self-start mb-8 flex items-center gap-1.5 text-xs text-slate-600 hover:text-primary transition-colors duration-300 group"
        >
          <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform duration-300">arrow_back</span>
          <span>Volver al inicio</span>
        </Link> */}

        {/* Logo */}
        <div className="mb-6 relative">
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-orange-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/30 -rotate-3 hover:rotate-0 transition-transform duration-500">
            <Logo className="w-12 h-12 text-white drop-shadow-lg" />
          </div>
          <div className="absolute -inset-2 rounded-3xl bg-primary/10 blur-xl -z-10 animate-pulse" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-black text-white tracking-tight mb-1 text-center">
          THUNDER <span className="text-primary">REHAB</span>
        </h1>
        <p className="text-slate-500 text-sm mb-8 text-center">
          Acceso exclusivo para profesionales
        </p>

        {/* Login Card */}
        <div 
          className="w-full bg-card-dark/80 backdrop-blur-xl rounded-3xl border border-slate-800/80 shadow-2xl shadow-black/40 overflow-hidden transition-all duration-500"
          style={{
            borderColor: focusedField ? 'rgba(250,215,0,0.25)' : 'rgba(30,41,59,0.8)',
          }}
        >
          {/* Card Header */}
          <div className="px-6 pt-7 pb-3">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-lg">lock</span>
              </div>
              <h2 className="text-lg font-bold text-white">Iniciar Sesión</h2>
            </div>
            <p className="text-slate-500 text-sm pl-11">
              Ingresá tus credenciales de administrador
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="px-6 pb-7 pt-2">
            {/* Error */}
            {error && (
              <div className="mb-4 p-3.5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-medium flex items-center gap-2.5 animate-[shake_0.3s_ease-in-out]">
                <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-red-400 text-lg">error</span>
                </div>
                <span>{error}</span>
              </div>
            )}

            {/* Username */}
            <div className="mb-4">
              <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2.5 pl-1">
                Usuario
              </label>
              <div className="relative group">
                <span 
                  className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-lg transition-colors duration-300"
                  style={{ color: focusedField === 'username' ? '#FAD700' : '#64748b' }}
                >
                  person
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setFocusedField('username')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Tu nombre de usuario"
                  className="w-full pl-12 pr-4 py-4 bg-white/[0.03] border border-slate-700/50 rounded-2xl text-white text-sm font-medium focus:ring-2 focus:ring-primary/40 focus:border-primary/50 outline-none transition-all duration-300 placeholder:text-slate-600 hover:border-slate-600"
                  required
                />
                <div 
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] bg-primary rounded-full transition-all duration-500"
                  style={{ width: focusedField === 'username' ? '80%' : '0%' }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="mb-6">
              <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2.5 pl-1">
                Contraseña
              </label>
              <div className="relative group">
                <span 
                  className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-lg transition-colors duration-300"
                  style={{ color: focusedField === 'password' ? '#FAD700' : '#64748b' }}
                >
                  lock
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Tu contraseña"
                  className="w-full pl-12 pr-12 py-4 bg-white/[0.03] border border-slate-700/50 rounded-2xl text-white text-sm font-medium focus:ring-2 focus:ring-primary/40 focus:border-primary/50 outline-none transition-all duration-300 placeholder:text-slate-600 hover:border-slate-600"
                  required
                />
                {/* Toggle password visibility */}
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-primary transition-colors duration-300"
                >
                  <span className="material-symbols-outlined text-lg">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
                <div 
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] bg-primary rounded-full transition-all duration-500"
                  style={{ width: focusedField === 'password' ? '80%' : '0%' }}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !username || !password}
              className="w-full py-4 bg-gradient-to-r from-primary to-orange-600 hover:from-primary hover:to-orange-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2.5 shadow-xl shadow-primary/25 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] text-sm"
            >
              {loading ? (
                <>
                  <Logo animate className="w-6 h-6 text-current drop-shadow-md" />
                  <span>Ingresando...</span>
                </>
              ) : (
                <>
                  <span>Ingresar al Panel</span>
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Security note */}
        <div className="mt-6 flex items-center gap-2 text-[11px] text-slate-600">
          <span className="material-symbols-outlined text-sm">shield</span>
          <span>Conexión segura · Solo personal autorizado</span>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-slate-700 mt-6 tracking-wide">
          THUNDER REHABILITACIÓN © 2026
        </p>
      </div>

      {/* Shake animation */}
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
