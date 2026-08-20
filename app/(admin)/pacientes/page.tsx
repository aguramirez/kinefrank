"use client";

import { useState, useEffect, useCallback } from "react";
import Logo from "@/components/Logo";
import HistoriaClinicaTab from "./HistoriaClinicaTab";
import Link from "next/link";
import { useRouter } from "next/navigation";

import ExerciseWeightChart from "@/components/ExerciseWeightChart";

/* ── Types ── */
interface RutinaEjercicio {
  id: string;
  exerciseId: string;
  sets: number;
  reps: number;
  weight?: number | null;
  time: string | null;
  intervalo: string | null;
  isCircuit: boolean;
}

interface RutinaDia {
  id: string;
  name: string;
  ejercicios: RutinaEjercicio[];
}

interface RutinaInfo {
  id: string;
  name: string;
  description: string;
  dias: RutinaDia[];
}

interface Paciente {
  id: string;
  fullName: string;
  dni: string;
  phone: string | null;
  email: string | null;
  gender: string | null;
  age: number | null;
  height: number | null;
  weight: number | null;
  notes: string | null;
  sessionsCount: number;
  totalSessions: number;
  healthInsurance: string | null;
  isActive: boolean;
  dischargeDate    : string | null;
  expirationDate   : string | null;
  diagnoses        : string[];
  rutinas          : RutinaInfo[];
  createdAt        : string;
  runningEnabled   : boolean;
}

type ModalMode = "create" | "edit" | "delete" | "view" | null;


const DEFAULT_FORM = {
  fullName: "", dni: "", phone: "", email: "", gender: "", age: "",
  height: "", weight: "", notes: "", healthInsurance: "", totalSessions: "", 
  expirationDate: "", diagnoses: [] as string[],
  runningEnabled: false,
};

export default function PacientesPage() {
  const router = useRouter();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'alta' | 'porVencer'>('all');

  // Modal
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<Paciente | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "diagnosticos" | "historia">("info");

  // Form
  const [form, setForm] = useState(DEFAULT_FORM);
  const [formError, setFormError] = useState("");

  // Diagnoses autocomplete
  const [allDiagnoses, setAllDiagnoses] = useState<string[]>([]);
  const [diagInput, setDiagInput] = useState("");

  // Toggle active
  const [toggleTarget, setToggleTarget] = useState<Paciente | null>(null);
  const [toggling, setToggling] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Rutina detail sub-modal
  const [rutinaDetail, setRutinaDetail] = useState<RutinaInfo | null>(null);
  const [chartExerciseModal, setChartExerciseModal] = useState<{ exerciseId: string; exerciseName: string; pacienteId: string; ejercicioEnDiaId?: string } | null>(null);

  // Ejercicios catalog (for resolving exercise names in rutina detail)
  interface EjercicioCatalog { id: string; name: string; }
  const [ejerciciosCatalog, setEjerciciosCatalog] = useState<EjercicioCatalog[]>([]);
  const getEjercicioName = (exerciseId: string) =>
    ejerciciosCatalog.find((e) => e.id === exerciseId)?.name || "Sin nombre";

  /* ── Fetch ── */
  const fetchPacientes = useCallback(async () => {
    try {
      const adminStr = localStorage.getItem("admin");
      const adminId = adminStr ? JSON.parse(adminStr).id : "";
      const url = adminId ? `/api/pacientes?adminId=${adminId}` : "/api/pacientes";
      const res = await fetch(url);
      if (res.ok) setPacientes(await res.json());
    } catch { showToast("Error al cargar pacientes", "error"); }
    finally { setLoading(false); }
  }, []);

  const fetchDiagnoses = useCallback(async () => {
    try {
      const res = await fetch("/api/diagnosticos");
      if (res.ok) setAllDiagnoses(await res.json());
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchPacientes(); fetchDiagnoses(); }, [fetchPacientes, fetchDiagnoses]);

  // Fetch ejercicios catalog
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/ejercicios");
        if (res.ok) setEjerciciosCatalog(await res.json());
      } catch { /* silent */ }
    })();
  }, []);

  const filtered = pacientes.filter((p) => {
    const matchesSearch = p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.dni.includes(searchQuery) ||
                          (p.email || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesStatus = true;
    if (filterStatus === 'active') matchesStatus = p.isActive;
    if (filterStatus === 'alta') matchesStatus = !p.isActive;
    if (filterStatus === 'porVencer') {
      if (!p.isActive || !p.expirationDate) {
        matchesStatus = false;
      } else {
        const exp = new Date(p.expirationDate);
        const now = new Date();
        const tenDays = new Date();
        tenDays.setDate(now.getDate() + 10);
        matchesStatus = exp <= tenDays && exp >= now;
      }
    }
    
    return matchesSearch && matchesStatus;
  });

  /* ── Modal helpers ── */
  const openCreate = () => {
    setForm({ ...DEFAULT_FORM });
    setFormError("");
    setActiveTab("info");
    setSelected(null);
    setModalMode("create");
  };

  const openEdit = (p: Paciente) => {
    setForm({
      fullName: p.fullName,
      dni: p.dni,
      phone: p.phone || "",
      email: p.email || "",
      gender: p.gender || "",
      age: p.age != null ? String(p.age) : "",
      height: p.height != null ? String(p.height) : "",
      weight: p.weight != null ? String(p.weight) : "",
      notes: p.notes || "",
      healthInsurance: p.healthInsurance || "",
      totalSessions: p.totalSessions != null ? String(p.totalSessions) : "",
      diagnoses: [...p.diagnoses],
      expirationDate: p.expirationDate ? p.expirationDate.split('T')[0] : "",
      runningEnabled: p.runningEnabled ?? false,
    });
    setFormError("");
    setActiveTab("info");
    setSelected(p);
    setModalMode("edit");
  };

  const openDelete = (p: Paciente) => { setSelected(p); setModalMode("delete"); };
  const openView = (p: Paciente) => { setSelected(p); setActiveTab("info"); setModalMode("view"); };
  const closeModal = () => { setModalMode(null); setSelected(null); setFormError(""); };

  /* ── Diagnoses ── */
  const addDiagnosis = (d: string) => {
    const trimmed = d.trim();
    if (trimmed && !form.diagnoses.includes(trimmed)) {
      setForm({ ...form, diagnoses: [...form.diagnoses, trimmed] });
    }
    setDiagInput("");
  };

  const removeDiagnosis = (d: string) => {
    setForm({ ...form, diagnoses: form.diagnoses.filter((x) => x !== d) });
  };

  const diagSuggestions = allDiagnoses.filter(
    (d) => d.toLowerCase().includes(diagInput.toLowerCase()) && !form.diagnoses.includes(d)
  );

  /* ── CRUD ── */
  const handleSave = async () => {
    if (!form.fullName.trim() || !form.dni.trim()) {
      setFormError("Nombre completo y DNI son obligatorios.");
      return;
    }

    setSaving(true);
    setFormError("");

    const adminStr = localStorage.getItem("admin");
    const adminObj = adminStr ? JSON.parse(adminStr) : null;

    const body = {
      fullName: form.fullName.trim(),
      dni: form.dni.trim(),
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      gender: form.gender || null,
      age: form.age ? Number(form.age) : null,
      height: form.height ? Number(form.height) : null,
      weight: form.weight ? Number(form.weight) : null,
      notes: form.notes?.trim() || null,
      healthInsurance: form.healthInsurance.trim() || null,
      totalSessions: form.totalSessions ? Number(form.totalSessions) : 0,
      diagnoses: form.diagnoses,
      expirationDate: form.expirationDate || null,
      adminId: adminObj ? adminObj.id : null,
      runningEnabled: form.runningEnabled,
    };

    try {
      const url = modalMode === "edit" && selected ? `/api/pacientes/${selected.id}` : "/api/pacientes";
      const method = modalMode === "edit" ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) {
        const data = await res.json();
        setFormError(data.error || "Error al guardar");
        return;
      }
      showToast(modalMode === "create" ? "Paciente creado" : "Paciente actualizado", "success");
      closeModal();
      fetchPacientes();
      fetchDiagnoses();
    } catch { setFormError("Error de conexión"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/pacientes/${selected.id}`, { method: "DELETE" });
      if (!res.ok) { showToast("Error al eliminar", "error"); return; }
      showToast("Paciente eliminado", "success");
      closeModal();
      fetchPacientes();
    } catch { showToast("Error de conexión", "error"); }
    finally { setSaving(false); }
  };

  /* ── Toggle Active ── */
  const handleToggleActive = async () => {
    if (!toggleTarget) return;
    setToggling(true);
    try {
      const res = await fetch(`/api/pacientes/${toggleTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !toggleTarget.isActive }),
      });
      if (!res.ok) { showToast("Error al cambiar estado", "error"); return; }
      showToast(toggleTarget.isActive ? "Paciente dado de alta" : "Paciente activado", "success");
      setToggleTarget(null);
      fetchPacientes();
    } catch { showToast("Error de conexión", "error"); }
    finally { setToggling(false); }
  };

  /* ── Rutina Actions ── */
  const handleDesasignarRutina = async () => {
    if (!rutinaDetail) return;
    if (!confirm("¿Estás seguro de desasignar esta rutina? No se borrará del sistema, pero el paciente ya no podrá verla.")) return;
    
    try {
      const res = await fetch(`/api/rutinas/${rutinaDetail.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: rutinaDetail.name,
          description: rutinaDetail.description,
          pacienteId: null, // This removes the assignment
          dias: rutinaDetail.dias
        }),
      });
      if (!res.ok) throw new Error();
      
      showToast("Rutina desasignada correctamente", "success");
      setRutinaDetail(null);
      fetchPacientes(); // Refresh patients to update routine counts
    } catch {
      showToast("Error al desasignar la rutina", "error");
    }
  };

  const handleEditRutina = () => {
    if (!rutinaDetail) return;
    router.push(`/rutinas?edit=${rutinaDetail.id}`);
  };

  /* ── Helpers ── */
  const updateForm = (field: string, value: any) => setForm({ ...form, [field]: value });
  const displayValue = (val: string | number | null | undefined, suffix = "") => {
    if (val == null || val === "" || val === 0) return "—";
    return `${val}${suffix}`;
  };

  return (
    <>
      {/* Header */}
      <header className="h-16 md:h-20 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 md:px-8 bg-white/50 dark:bg-background-dark/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-4 flex-1 max-w-md">
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
            <input
              className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-white/5 border-none rounded-lg focus:ring-2 focus:ring-primary text-sm outline-none dark:text-white placeholder:text-slate-400"
              placeholder="Buscar por nombre, DNI o email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 md:px-5 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-sm shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all ml-4">
          <span className="material-symbols-outlined text-lg">person_add</span>
          <span className="hidden sm:inline">Nuevo Paciente</span>
        </button>
      </header>

      <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">Pacientes</h1>
          {/* <p className="text-slate-500 dark:text-slate-400 mt-1 md:mt-2 text-sm md:text-base">
            Gestioná los pacientes del consultorio. Actualmente hay <span className="text-primary font-bold">{pacientes.length}</span> pacientes.
          </p> */}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          <div className="bg-white dark:bg-card-dark p-4 md:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3 md:gap-4 hover:border-primary/50 transition-all">
            <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-primary/10 rounded-xl text-primary flex-shrink-0">
              <span className="material-symbols-outlined text-xl md:text-2xl">groups</span>
            </div>
            <div className="min-w-0">
              <p className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white truncate">{pacientes.length}</p>
              <p className="text-[10px] md:text-xs font-medium text-slate-500 dark:text-slate-400 truncate">Total</p>
            </div>
          </div>
          
          <button 
            onClick={() => setFilterStatus(filterStatus === 'active' ? 'all' : 'active')}
            className={`p-4 md:p-5 text-left rounded-xl border shadow-sm transition-all flex items-center gap-3 md:gap-4 flex-1 min-w-0 ${
              filterStatus === 'active'
                ? "bg-emerald-500/10 border-emerald-500/50 hover:bg-emerald-500/20"
                : "bg-white dark:bg-card-dark border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 group"
            }`}
          >
            <div className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl flex-shrink-0 transition-colors ${filterStatus === 'active' ? "bg-emerald-500/20 text-emerald-500" : "bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500/20"}`}>
              <span className="material-symbols-outlined text-xl md:text-2xl">check_circle</span>
            </div>
            <div className="min-w-0">
              <p className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white truncate">
                {pacientes.filter((p) => p.isActive).length}
              </p>
              <p className="text-[10px] md:text-xs font-medium text-slate-500 dark:text-slate-400 truncate">Activos</p>
            </div>
          </button>

          <button 
            onClick={() => setFilterStatus(filterStatus === 'alta' ? 'all' : 'alta')}
            className={`p-4 md:p-5 text-left rounded-xl border shadow-sm transition-all flex items-center gap-3 md:gap-4 flex-1 min-w-0 ${
              filterStatus === 'alta'
                ? "bg-amber-500/10 border-amber-500/50 hover:bg-amber-500/20"
                : "bg-white dark:bg-card-dark border-slate-200 dark:border-slate-800 hover:border-amber-500/50 group"
            }`}
          >
            <div className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl flex-shrink-0 transition-colors ${filterStatus === 'alta' ? "bg-amber-500/20 text-amber-500" : "bg-amber-500/10 text-amber-500 group-hover:bg-amber-500/20"}`}>
              <span className="material-symbols-outlined text-xl md:text-2xl">cancel</span>
            </div>
            <div className="min-w-0">
              <p className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white truncate">
                {pacientes.filter((p) => !p.isActive).length}
              </p>
              <p className="text-[10px] md:text-xs font-medium text-slate-500 dark:text-slate-400 truncate">Alta</p>
            </div>
          </button>

          <button 
            onClick={() => setFilterStatus(filterStatus === 'porVencer' ? 'all' : 'porVencer')}
            className={`p-4 md:p-5 text-left rounded-xl border shadow-sm transition-all flex items-center gap-3 md:gap-4 flex-1 min-w-0 ${
              filterStatus === 'porVencer'
                ? "bg-rose-500/10 border-rose-500/50 hover:bg-rose-500/20"
                : "bg-white dark:bg-card-dark border-slate-200 dark:border-slate-800 hover:border-rose-500/50 group"
            }`}
          >
            <div className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl flex-shrink-0 transition-colors ${filterStatus === 'porVencer' ? "bg-rose-500/20 text-rose-500" : "bg-rose-500/10 text-rose-500 group-hover:bg-rose-500/20"}`}>
              <span className="material-symbols-outlined text-xl md:text-2xl">history_toggle_off</span>
            </div>
            <div className="min-w-0">
              <p className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white truncate">
                {pacientes.filter((p) => {
                  if (!p.isActive || !p.expirationDate) return false;
                  const exp = new Date(p.expirationDate);
                  const now = new Date();
                  const tenDays = new Date();
                  tenDays.setDate(now.getDate() + 10);
                  return exp <= tenDays && exp >= now;
                }).length}
              </p>
              <p className="text-[10px] md:text-xs font-medium text-slate-500 dark:text-slate-400 truncate">Por vencer</p>
            </div>
          </button>

          <div className="bg-white dark:bg-card-dark p-4 md:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3 md:gap-4 hover:border-primary/50 transition-all">
            <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-blue-500/10 rounded-xl text-blue-500 flex-shrink-0">
              <span className="material-symbols-outlined text-xl md:text-2xl">event</span>
            </div>
            <div className="min-w-0">
              <p className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white truncate">{pacientes.reduce((a, p) => a + p.sessionsCount, 0)}</p>
              <p className="text-[10px] md:text-xs font-medium text-slate-500 dark:text-slate-400 truncate">Sesiones</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Logo animate className="w-12 h-12 text-primary mb-4" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">Cargando pacientes...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-card-dark rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-4xl text-slate-400">{searchQuery ? "search_off" : "groups"}</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{searchQuery ? "Sin resultados" : "No hay pacientes"}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{searchQuery ? `No se encontraron pacientes para "${searchQuery}"` : "Agregá tu primer paciente"}</p>
            {!searchQuery && (
              <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold rounded-xl text-sm shadow-lg shadow-primary/20 transition-all">
                <span className="material-symbols-outlined text-lg">person_add</span>Crear Paciente
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block bg-white dark:bg-card-dark rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                  <tr className="bg-slate-50 dark:bg-white/5 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">Paciente</th>
                    <th className="px-6 py-4">DNI</th>
                    <th className="px-6 py-4">Obra Social</th>
                    <th className="px-6 py-4 text-center">Sesiones</th>
                    <th className="px-6 py-4 text-center">Estado</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 text-sm font-bold uppercase">
                            {p.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-slate-900 dark:text-white">{p.fullName}</p>
                              {(() => {
                                if (!p.isActive || !p.expirationDate) return null;
                                const exp = new Date(p.expirationDate);
                                const now = new Date();
                                const tenDays = new Date();
                                tenDays.setDate(now.getDate() + 10);
                                if (exp <= tenDays && exp >= now) {
                                  const diff = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                                  return (
                                    <div className="group/tooltip relative flex items-center">
                                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-[10px] rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
                                        Vence en {diff} {diff === 1 ? 'día' : 'días'}
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">{p.email || "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 font-mono">{p.dni}</td>
                      <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{p.healthInsurance || "—"}</td>
                      <td className="px-6 py-4 text-center"><span className="text-sm font-bold text-primary">{p.sessionsCount}</span></td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => setToggleTarget(p)}
                          className="inline-flex items-center gap-2 group cursor-pointer"
                          title={p.isActive ? "Dar de alta" : "Activar paciente"}
                        >
                          <div className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${p.isActive ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`}>
                            <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${p.isActive ? "translate-x-4" : "translate-x-0"}`} />
                          </div>
                          <span className={`text-[10px] font-bold ${p.isActive ? "text-emerald-500" : "text-slate-400"}`}>
                            {p.isActive ? "Activo" : "Alta"}
                          </span>
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openView(p)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all" title="Ver"><span className="material-symbols-outlined text-lg">visibility</span></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>

            {/* Mobile list */}
            <div className="md:hidden space-y-3">
              {filtered.map((p) => (
                <div key={p.id} className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 text-sm font-bold uppercase">
                      {p.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{p.fullName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">DNI: {p.dni}</p>
                    </div>
                    <button
                      onClick={() => setToggleTarget(p)}
                      className="inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <div className={`relative w-8 h-[18px] rounded-full transition-colors duration-200 ${p.isActive ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`}>
                        <div className={`absolute top-[2px] left-[2px] w-3.5 h-3.5 bg-white rounded-full shadow-sm transition-transform duration-200 ${p.isActive ? "translate-x-3.5" : "translate-x-0"}`} />
                      </div>
                      <span className={`text-[10px] font-bold ${p.isActive ? "text-emerald-500" : "text-slate-400"}`}>
                        {p.isActive ? "Activo" : "Alta"}
                      </span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      {p.healthInsurance && <span>{p.healthInsurance}</span>}
                      <span className="text-primary font-bold">{p.sessionsCount} sesiones</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openView(p)} className="p-1.5 text-slate-400 hover:text-blue-500 rounded-lg transition-all"><span className="material-symbols-outlined text-lg">visibility</span></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ===== MODAL ===== */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]" onClick={closeModal}>
          <div className={`bg-white dark:bg-card-dark w-full rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl shadow-black/40 overflow-hidden animate-[slideUp_0.3s_ease-out] flex flex-col ${modalMode === "delete" ? "max-w-md" : "max-w-2xl max-h-[90vh]"}`} onClick={(e) => e.stopPropagation()}>

            {/* ── Delete ── */}
            {modalMode === "delete" && selected && (
              <>
                <div className="p-6 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4"><span className="material-symbols-outlined text-red-500 text-3xl">delete_forever</span></div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Eliminar Paciente</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">¿Estás seguro que querés eliminar a</p>
                  <p className="text-primary font-bold mb-3">&quot;{selected.fullName}&quot;</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">DNI: {selected.dni} · Esta acción no se puede deshacer.</p>
                </div>
                <div className="flex gap-3 p-6 pt-0">
                  <button onClick={closeModal} className="flex-1 py-3 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-white/10 transition-all">Cancelar</button>
                  <button onClick={handleDelete} disabled={saving} className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    {saving ? <Logo animate className="w-5 h-5 text-current" /> : <span className="material-symbols-outlined text-lg">delete</span>}
                    {saving ? "Eliminando..." : "Eliminar"}
                  </button>
                </div>
              </>
            )}

            {/* ── View ── */}
            {modalMode === "view" && selected && (
              <>
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg uppercase">
                      {selected.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selected.fullName}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">DNI: {selected.dni} · {selected.isActive ? "Activo" : "Alta"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(selected)} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all" title="Editar"><span className="material-symbols-outlined">edit</span></button>
                    <button onClick={() => openDelete(selected)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all" title="Eliminar"><span className="material-symbols-outlined">delete</span></button>
                    <button onClick={closeModal} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-all"><span className="material-symbols-outlined">close</span></button>
                  </div>
                </div>
                {/* Tabs */}
                <div className="flex border-b border-slate-200 dark:border-slate-800 flex-shrink-0 overflow-x-auto no-scrollbar">
                  {(["info", "diagnosticos", "historia"] as const).map((t) => (
                    <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 min-w-[max-content] px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all relative ${activeTab === t ? "text-primary" : "text-slate-400 hover:text-slate-600"}`}>
                      {t === "info" ? "Info" : t === "diagnosticos" ? "Diag" : "Historia Clinica"}
                      {activeTab === t && <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary rounded-full" />}
                    </button>
                  ))}
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                  {activeTab === "info" && (
                    <div className="space-y-3">
                      {/* Rutinas asignadas */}
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-slate-800">
                        <p className="text-[10px] text-slate-400 uppercase font-bold mb-2">Rutinas Asignadas</p>
                        {(!selected.rutinas || selected.rutinas.length === 0) ? (
                          <div className="flex flex-col items-center justify-center py-6 bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-slate-700">
                            <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 mb-2">assignment_add</span>
                            <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">Sin rutina asignada</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Este paciente no tiene ninguna rutina de rehabilitación activa.</p>
                            <Link href={`/rutinas?pacienteId=${selected.id}`} className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-primary/20 flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[16px]">add</span>
                              Crear rutina
                            </Link>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            {selected.rutinas.map((r) => (
                              <button
                                key={r.id}
                                onClick={() => setRutinaDetail(r)}
                                className="w-full flex items-center gap-2.5 p-2.5 rounded-lg bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-700 hover:border-primary/50 hover:bg-primary/5 transition-all text-left group cursor-pointer"
                              >
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                                  <span className="material-symbols-outlined text-sm">assignment</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-primary transition-colors truncate">{r.name}</p>
                                  <p className="text-[10px] text-slate-400">{r.dias.length} {r.dias.length === 1 ? "día" : "días"} · {r.dias.reduce((a, d) => a + d.ejercicios.length, 0)} ejercicios</p>
                                </div>
                                <span className="material-symbols-outlined text-slate-400 group-hover:text-primary text-sm transition-colors">chevron_right</span>
                              </button>
                            ))}
                            <Link href={`/rutinas?pacienteId=${selected.id}`} className="w-full mt-2 py-2 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-500 dark:text-slate-400 hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-1.5 bg-white/50 dark:bg-card-dark/50">
                              <span className="material-symbols-outlined text-sm">add</span>
                              Asignar otra rutina
                            </Link>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { label: "Email", value: displayValue(selected.email), icon: "mail" },
                          { label: "Teléfono", value: displayValue(selected.phone), icon: "phone" },
                          { label: "Género", value: displayValue(selected.gender), icon: "wc" },
                          { label: "Edad", value: selected.age != null ? `${selected.age} años` : "—", icon: "cake" },
                          { label: "Altura", value: selected.height != null ? `${selected.height} cm` : "—", icon: "height" },
                          { label: "Peso", value: selected.weight != null ? `${selected.weight} kg` : "—", icon: "monitor_weight" },
                          { label: "Obra Social", value: displayValue(selected.healthInsurance), icon: "health_and_safety" },
                          { label: "Sesiones", value: String(selected.sessionsCount), icon: "event" },
                        ].map((item) => (
                          <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-slate-800">
                            <span className="material-symbols-outlined text-primary text-lg">{item.icon}</span>
                            <div>
                              <p className="text-[10px] text-slate-400 uppercase font-bold">{item.label}</p>
                              <p className="text-sm font-medium text-slate-900 dark:text-white">{item.value}</p>
                            </div>
                          </div>
                        ))}
                        {selected.notes && (
                          <div className="col-span-full p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-slate-800">
                            <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Notas</p>
                            <p className="text-sm text-slate-700 dark:text-slate-300 italic">{selected.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {activeTab === "diagnosticos" && (
                    <div>
                      {selected.diagnoses.length === 0 ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">Sin diagnósticos registrados</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {selected.diagnoses.map((d) => (
                            <span key={d} className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-bold">{d}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {activeTab === "historia" && (
                    <HistoriaClinicaTab pacienteId={selected.id} />
                  )}
                </div>
              </>
            )}

            {/* ── Create / Edit ── */}
            {(modalMode === "create" || modalMode === "edit") && (
              <>
                <div className="p-5 md:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><span className="material-symbols-outlined">{modalMode === "create" ? "person_add" : "edit"}</span></div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{modalMode === "create" ? "Nuevo Paciente" : "Editar Paciente"}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{modalMode === "create" ? "Solo nombre y DNI son obligatorios" : `Editando: ${selected?.fullName}`}</p>
                    </div>
                  </div>
                  <button onClick={closeModal} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-all"><span className="material-symbols-outlined">close</span></button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 dark:border-slate-800 flex-shrink-0 overflow-x-auto no-scrollbar">
                  {(["info", "diagnosticos", "historia"] as const).map((t) => (
                    <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 min-w-[max-content] px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all relative ${activeTab === t ? "text-primary" : "text-slate-400 hover:text-slate-600"}`}>
                      {t === "info" ? "Info" : t === "diagnosticos" ? "Diag" : "Historia Clinica"}
                      {activeTab === t && <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary rounded-full" />}
                    </button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto p-5 md:p-6">
                  {formError && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">error</span>{formError}
                    </div>
                  )}

                  {activeTab === "info" && (
                    <div className="space-y-4">
                      {/* Required fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">
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
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">
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
                      </div>

                      {/* Separator */}
                      <div className="flex items-center gap-3 pt-2">
                        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Datos opcionales</span>
                        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                      </div>

                      {/* Optional fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">Email</label>
                          <input type="email" value={form.email} onChange={(e) => updateForm("email", e.target.value)} placeholder="juan@mail.com" className="w-full px-4 py-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/40 focus:border-primary/50 outline-none transition-all dark:text-white placeholder:text-slate-400" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">Teléfono</label>
                          <input type="text" value={form.phone} onChange={(e) => updateForm("phone", e.target.value)} placeholder="+54 9 11 1234-5678" className="w-full px-4 py-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/40 focus:border-primary/50 outline-none transition-all dark:text-white placeholder:text-slate-400" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">Género</label>
                          <select value={form.gender} onChange={(e) => updateForm("gender", e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium dark:text-white outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer">
                            <option value="">Sin especificar</option>
                            <option value="Masculino">Masculino</option>
                            <option value="Femenino">Femenino</option>
                            <option value="Otro">Otro</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">Edad</label>
                          <input type="number" value={form.age} onChange={(e) => updateForm("age", e.target.value)} placeholder="30" min={0} className="w-full px-4 py-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/40 focus:border-primary/50 outline-none transition-all dark:text-white placeholder:text-slate-400" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">Altura (cm)</label>
                          <input type="number" value={form.height} onChange={(e) => updateForm("height", e.target.value)} placeholder="175" step="0.1" className="w-full px-4 py-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/40 focus:border-primary/50 outline-none transition-all dark:text-white placeholder:text-slate-400" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">Peso (kg)</label>
                          <input type="number" value={form.weight} onChange={(e) => updateForm("weight", e.target.value)} placeholder="78" step="0.1" className="w-full px-4 py-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/40 focus:border-primary/50 outline-none transition-all dark:text-white placeholder:text-slate-400" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">Obra Social</label>
                          <input type="text" value={form.healthInsurance} onChange={(e) => updateForm("healthInsurance", e.target.value)} placeholder="OSDE / IOMA / etc." className="w-full px-4 py-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/40 focus:border-primary/50 outline-none transition-all dark:text-white placeholder:text-slate-400" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">Sesiones Totales</label>
                          <input type="number" value={form.totalSessions} onChange={(e) => updateForm("totalSessions", e.target.value)} placeholder="20" min={0} className="w-full px-4 py-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/40 focus:border-primary/50 outline-none transition-all dark:text-white placeholder:text-slate-400" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">Vencimiento (Alta Automática)</label>
                          <input type="date" value={form.expirationDate} onChange={(e) => updateForm("expirationDate", e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/40 focus:border-primary/50 outline-none transition-all dark:text-white placeholder:text-slate-400" />
                        </div>
                        <div className="flex items-center gap-3 pt-4 sm:pt-6">
                          <input
                            type="checkbox"
                            id="runningEnabled"
                            checked={form.runningEnabled}
                            onChange={(e) => updateForm("runningEnabled", e.target.checked)}
                            className="w-4 h-4 text-primary bg-slate-100 dark:bg-white/5 border-slate-300 dark:border-slate-700 rounded focus:ring-primary/40 focus:ring-2 cursor-pointer"
                          />
                          <label htmlFor="runningEnabled" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                            Habilitar Módulo de Running
                          </label>
                        </div>
                        <div className="col-span-full">
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">Notas</label>
                          <textarea value={form.notes} onChange={(e) => updateForm("notes", e.target.value)} placeholder="Observaciones adicionales..." rows={2} className="w-full px-4 py-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/40 outline-none transition-all dark:text-white placeholder:text-slate-400 resize-none" />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "diagnosticos" && (
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Agregar Diagnóstico (escribí y presioná Enter)</label>
                      <div className="relative mb-4">
                        <input
                          type="text"
                          value={diagInput}
                          onChange={(e) => setDiagInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addDiagnosis(diagInput); } }}
                          placeholder="Ej: Dolor de hombro"
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/40 outline-none transition-all dark:text-white placeholder:text-slate-400"
                        />
                        {diagInput && diagSuggestions.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg overflow-hidden z-10 max-h-40 overflow-y-auto">
                            {diagSuggestions.map((d) => (
                              <button key={d} onClick={() => addDiagnosis(d)} className="w-full text-left px-4 py-2.5 text-sm hover:bg-primary/10 hover:text-primary transition-colors dark:text-white">{d}</button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {form.diagnoses.map((d) => (
                          <span key={d} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-bold">
                            {d}
                            <button onClick={() => removeDiagnosis(d)} className="hover:text-red-500 transition-colors"><span className="material-symbols-outlined text-xs">close</span></button>
                          </span>
                        ))}
                        {form.diagnoses.length === 0 && <p className="text-xs text-slate-400 italic">No hay diagnósticos agregados</p>}
                      </div>
                    </div>
                  )}

                  {activeTab === "historia" && (
                    <HistoriaClinicaTab pacienteId={selected?.id || ""} />
                  )}


                </div>

                {/* Footer */}
                <div className="flex gap-3 p-5 md:p-6 border-t border-slate-200 dark:border-slate-800 flex-shrink-0">
                  <button onClick={closeModal} className="flex-1 py-3.5 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-white/10 transition-all">Cancelar</button>
                  <button onClick={handleSave} disabled={saving} className="flex-1 py-3.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]">
                    {saving ? <Logo animate className="w-5 h-5 text-current" /> : <span className="material-symbols-outlined text-lg">{modalMode === "create" ? "person_add" : "save"}</span>}
                    {saving ? "Guardando..." : modalMode === "create" ? "Crear Paciente" : "Guardar Cambios"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ===== TOGGLE ACTIVE MODAL ===== */}
      {toggleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]" onClick={() => setToggleTarget(null)}>
          <div className="bg-white dark:bg-card-dark w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl shadow-black/40 overflow-hidden animate-[slideUp_0.3s_ease-out]" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 text-center">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${toggleTarget.isActive ? "bg-amber-500/10" : "bg-emerald-500/10"}`}>
                <span className={`material-symbols-outlined text-3xl ${toggleTarget.isActive ? "text-amber-500" : "text-emerald-500"}`}>
                  {toggleTarget.isActive ? "person_off" : "person_check"}
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                {toggleTarget.isActive ? "Dar de Alta" : "Activar Paciente"}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">
                {toggleTarget.isActive
                  ? "¿Estás seguro de dar de alta al paciente"
                  : "¿Estás seguro de activar al paciente"}
              </p>
              <p className="text-primary font-bold mb-3">&quot;{toggleTarget.fullName}&quot;</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                DNI: {toggleTarget.dni} · {toggleTarget.isActive ? "El paciente pasará a estado de alta." : "El paciente volverá a estar activo."}
              </p>
            </div>
            <div className="flex gap-3 p-6 pt-0">
              <button onClick={() => setToggleTarget(null)} className="flex-1 py-3 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-white/10 transition-all">Cancelar</button>
              <button
                onClick={handleToggleActive}
                disabled={toggling}
                className={`flex-1 py-3 text-white rounded-xl text-sm font-bold shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
                  toggleTarget.isActive
                    ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20"
                    : "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20"
                }`}
              >
                {toggling
                  ? <Logo animate className="w-5 h-5 text-current" />
                  : <span className="material-symbols-outlined text-lg">{toggleTarget.isActive ? "person_off" : "person_check"}</span>}
                {toggling ? "Procesando..." : toggleTarget.isActive ? "Dar de Alta" : "Activar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== RUTINA DETAIL MODAL ===== */}
      {rutinaDetail && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]" onClick={() => setRutinaDetail(null)}>
          <div className="bg-white dark:bg-card-dark w-full max-w-2xl max-h-[85vh] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl shadow-black/40 overflow-hidden animate-[slideUp_0.3s_ease-out] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="p-5 md:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <button onClick={() => setRutinaDetail(null)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all flex-shrink-0">
                  <span className="material-symbols-outlined text-lg">arrow_back</span>
                </button>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                  <span className="material-symbols-outlined">assignment</span>
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">{rutinaDetail.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{rutinaDetail.description}</p>
                </div>
              </div>
              <button onClick={() => setRutinaDetail(null)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-all flex-shrink-0">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Days & exercises */}
            <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-4">
              {rutinaDetail.dias.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">Esta rutina no tiene días configurados.</p>
              ) : (
                rutinaDetail.dias.map((dia, dIdx) => (
                  <div key={dia.id} className="bg-slate-50 dark:bg-white/[0.03] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{dIdx + 1}</span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{dia.name}</h4>
                      <span className="text-[10px] text-slate-400 ml-auto">{dia.ejercicios.length} ejercicios</span>
                    </div>
                    {dia.ejercicios.length === 0 ? (
                      <p className="px-4 py-3 text-xs text-slate-400 italic">Sin ejercicios</p>
                    ) : (
                      <div className="divide-y divide-slate-200 dark:divide-slate-800">
                        {dia.ejercicios.map((ej, eIdx) => (
                          <div key={eIdx} className="px-4 py-3 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              {ej.isCircuit ? (
                                <img src="/rayo.svg" alt="⚡" className="w-5 h-5 flex-shrink-0" />
                              ) : (
                                <span className="material-symbols-outlined text-primary text-lg flex-shrink-0">fitness_center</span>
                              )}
                              <span className="text-sm font-medium text-slate-900 dark:text-white truncate">{getEjercicioName(ej.exerciseId)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs flex-shrink-0 flex-wrap justify-end">
                              <span className="px-2 py-1 bg-primary/10 text-primary rounded-lg font-bold">{ej.sets} sets</span>
                              <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded-lg font-bold">{ej.reps} reps</span>
                              {ej.weight !== undefined && ej.weight !== null && (
                                <span className="px-2 py-1 bg-orange-500/10 text-orange-400 rounded-lg font-bold">{ej.weight} kg</span>
                              )}
                              {ej.time && <span className="px-2 py-1 bg-amber-500/10 text-amber-400 rounded-lg font-bold">{ej.time}</span>}
                              {ej.intervalo && <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg font-bold">{ej.intervalo}</span>}
                              {selected && (
                                <button
                                  onClick={() => setChartExerciseModal({
                                    exerciseId: ej.exerciseId,
                                    exerciseName: getEjercicioName(ej.exerciseId),
                                    pacienteId: selected.id,
                                    ejercicioEnDiaId: ej.id
                                  })}
                                  className="p-1 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                                  title="Ver gráfico de progreso de peso"
                                >
                                  <span className="material-symbols-outlined text-[18px]">show_chart</span>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer with Actions */}
            <div className="p-5 md:p-6 border-t border-slate-200 dark:border-slate-800 flex gap-3 flex-shrink-0 bg-slate-50/50 dark:bg-card-dark">
              <button 
                onClick={handleDesasignarRutina}
                className="flex-1 py-3 text-red-500 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">person_remove</span>
                Desasignar del paciente
              </button>
              <button 
                onClick={handleEditRutina}
                className="flex-1 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">edit</span>
                Editar Rutina
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chart Submodal */}
      {chartExerciseModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]" onClick={() => setChartExerciseModal(null)}>
          <div className="bg-white dark:bg-card-dark w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 space-y-4 animate-[slideUp_0.3s_ease-out]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Progreso de Peso - {chartExerciseModal.exerciseName}</h3>
              <button onClick={() => setChartExerciseModal(null)} className="p-2 text-slate-400 hover:text-white rounded-lg">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <ExerciseWeightChart
              exerciseId={chartExerciseModal.exerciseId}
              ejercicioEnDiaId={chartExerciseModal.ejercicioEnDiaId}
              pacienteId={chartExerciseModal.pacienteId}
              exerciseName={chartExerciseModal.exerciseName}
              onWeightDeleted={(newWeight) => {
                if (rutinaDetail) {
                  setRutinaDetail({
                    ...rutinaDetail,
                    dias: rutinaDetail.dias.map(d => ({
                      ...d,
                      ejercicios: d.ejercicios.map(e => e.id === chartExerciseModal.ejercicioEnDiaId ? { ...e, weight: newWeight } : e)
                    }))
                  });
                }
                setPacientes(prevPacientes =>
                  prevPacientes.map(p => ({
                    ...p,
                    rutinas: p.rutinas.map(r => ({
                      ...r,
                      dias: r.dias.map(d => ({
                        ...d,
                        ejercicios: d.ejercicios.map(e => e.id === chartExerciseModal.ejercicioEnDiaId ? { ...e, weight: newWeight } : e)
                      }))
                    }))
                  }))
                );
              }}
            />
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl text-sm font-bold shadow-2xl animate-[slideUp_0.3s_ease-out] ${toast.type === "success" ? "bg-emerald-500 text-white shadow-emerald-500/30" : "bg-red-500 text-white shadow-red-500/30"}`}>
          <span className="material-symbols-outlined text-lg">{toast.type === "success" ? "check_circle" : "error"}</span>
          {toast.message}
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>
    </>
  );
}
