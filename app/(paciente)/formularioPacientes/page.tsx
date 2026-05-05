"use client";

import { useState } from "react";
import Logo from "@/components/Logo";
import Link from "next/link";

const DEFAULT_FORM = {
  fullName: "",
  dni: "",
  phone: "",
  email: "",
  gender: "",
  age: "",
  height: "",
  weight: "",
  healthInsurance: "",
};

export default function FormularioPacientesPage() {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const updateForm = (field: string, value: string) =>
    setForm({ ...form, [field]: value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!form.fullName.trim() || !form.dni.trim()) {
      setFormError("Nombre completo y DNI son obligatorios.");
      return;
    }

    setSaving(true);

    const body = {
      fullName: form.fullName.trim(),
      dni: form.dni.trim(),
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      gender: form.gender || null,
      age: form.age ? Number(form.age) : null,
      height: form.height ? Number(form.height) : null,
      weight: form.weight ? Number(form.weight) : null,
      healthInsurance: form.healthInsurance.trim() || null,
    };

    try {
      const res = await fetch("/api/pacientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setFormError(data.error || "Error al guardar");
        return;
      }

      setSuccess(true);
    } catch {
      setFormError("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  if (success) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-5xl text-emerald-500">check_circle</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Registro exitoso</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-xs">
          Tus datos fueron registrados correctamente. Pronto podrás acceder a tu información.
        </p>
        <Link
          href="/"
          className="px-6 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-sm shadow-lg shadow-primary/20 transition-all"
        >
          Iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="p-6 pb-0 text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-3xl text-primary">person_add</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Registro de Paciente</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Completá tus datos para registrarte
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 p-6 space-y-4">
        {formError && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            {formError}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Nombre Completo <span className="text-primary">*</span>
          </label>
          <input
            type="text"
            value={form.fullName}
            onChange={(e) => updateForm("fullName", e.target.value)}
            placeholder="Juan Pérez"
            className="w-full px-4 py-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/40 focus:border-primary/50 outline-none transition-all dark:text-white placeholder:text-slate-400"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            DNI <span className="text-primary">*</span>
          </label>
          <input
            type="text"
            value={form.dni}
            onChange={(e) => updateForm("dni", e.target.value)}
            placeholder="99888777"
            className="w-full px-4 py-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/40 focus:border-primary/50 outline-none transition-all dark:text-white placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-3 py-2">
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Opcional</span>
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
        </div>

        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => updateForm("email", e.target.value)}
            placeholder="juan@mail.com"
            className="w-full px-4 py-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/40 focus:border-primary/50 outline-none transition-all dark:text-white placeholder:text-slate-400"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Teléfono</label>
          <input
            type="text"
            value={form.phone}
            onChange={(e) => updateForm("phone", e.target.value)}
            placeholder="+54 9 11 1234-5678"
            className="w-full px-4 py-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/40 focus:border-primary/50 outline-none transition-all dark:text-white placeholder:text-slate-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Género</label>
            <select
              value={form.gender}
              onChange={(e) => updateForm("gender", e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium dark:text-white outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer appearance-none"
            >
              <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Sin especificar</option>
              <option value="Masculino" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Masculino</option>
              <option value="Femenino" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Femenino</option>
              <option value="Otro" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Otro</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Edad</label>
            <input
              type="number"
              value={form.age}
              onChange={(e) => updateForm("age", e.target.value)}
              placeholder="30"
              min={0}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/40 focus:border-primary/50 outline-none transition-all dark:text-white placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Altura (cm)</label>
            <input
              type="number"
              value={form.height}
              onChange={(e) => updateForm("height", e.target.value)}
              placeholder="175"
              step="0.1"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/40 focus:border-primary/50 outline-none transition-all dark:text-white placeholder:text-slate-400"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Peso (kg)</label>
            <input
              type="number"
              value={form.weight}
              onChange={(e) => updateForm("weight", e.target.value)}
              placeholder="78"
              step="0.1"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/40 focus:border-primary/50 outline-none transition-all dark:text-white placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Obra Social</label>
          <input
            type="text"
            value={form.healthInsurance}
            onChange={(e) => updateForm("healthInsurance", e.target.value)}
            placeholder="OSDE / IOMA / etc."
            className="w-full px-4 py-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/40 focus:border-primary/50 outline-none transition-all dark:text-white placeholder:text-slate-400"
          />
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-sm shadow-lg shadow-primary/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Logo animate className="w-5 h-5 text-current" />
                Registrando...
              </>
            ) : (
              "Registrarme"
            )}
          </button>
        </div>

        <div className="text-center pt-2">
          <Link href="/" className="text-xs text-slate-400 hover:text-primary transition-colors">
            Ya tengo una cuenta
          </Link>
        </div>
      </form>
    </div>
  );
}
