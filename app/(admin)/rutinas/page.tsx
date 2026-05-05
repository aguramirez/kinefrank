"use client";

import { useState, useEffect, useCallback } from "react";
import Logo from "@/components/Logo";
import ExerciseVideo from "@/components/ExerciseVideo";

/* ── Types ── */
interface Ejercicio {
  id: string;
  name: string;
  description: string;
  videoUrl: string | null;
  categories: string[];
}

interface EjercicioEnDia {
  id?: string;
  exerciseId: string;
  sets: number;
  reps: number;
  time: string;
  intervalo: string;
  isCircuit: boolean;
}

interface Dia {
  id?: string;
  name: string;
  ejercicios: EjercicioEnDia[];
}

interface Rutina {
  id: string;
  name: string;
  description: string;
  pacienteId: string | null;
  paciente: { id: string; fullName: string; dni: string } | null;
  dias: (Dia & { id: string })[];
  createdAt: string;
}

type ModalMode = "create" | "edit" | "delete" | "view" | null;

interface PacienteBasic {
  id: string;
  fullName: string;
  dni: string;
  isActive: boolean;
}

export default function RutinasPage() {
  const [rutinas, setRutinas] = useState<Rutina[]>([]);
  const [ejerciciosCatalog, setEjerciciosCatalog] = useState<Ejercicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterUnassigned, setFilterUnassigned] = useState(false);

  // Modal
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedRutina, setSelectedRutina] = useState<Rutina | null>(null);
  const [saving, setSaving] = useState(false);
  const [createAssignMode, setCreateAssignMode] = useState(false);
  const [initialPacienteId, setInitialPacienteId] = useState<string | null>(null);

  // Form
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDias, setFormDias] = useState<Dia[]>([]);
  const [formError, setFormError] = useState("");

  // Drag & Drop
  const [draggedItem, setDraggedItem] = useState<{ dayIdx: number; exIdx: number } | null>(null);
  const [dragOverItem, setDragOverItem] = useState<{ dayIdx: number; exIdx: number } | null>(null);

  // Exercise Selector
  const [selectorDayIdx, setSelectorDayIdx] = useState<number | null>(null);
  const [selectorSearch, setSelectorSearch] = useState("");
  const [selectorSelectedEx, setSelectorSelectedEx] = useState<Ejercicio | null>(null);
  const [selectorSets, setSelectorSets] = useState(3);
  const [selectorReps, setSelectorReps] = useState(12);
  const [selectorTime, setSelectorTime] = useState("");
  const [selectorIntervalo, setSelectorIntervalo] = useState("");
  const [selectorIsCircuit, setSelectorIsCircuit] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Assign modal
  const [assignRutina, setAssignRutina] = useState<Rutina | null>(null);
  const [allPacientes, setAllPacientes] = useState<PacienteBasic[]>([]);
  const [allAlumnos, setAllAlumnos] = useState<any[]>([]);
  const [assignedIds, setAssignedIds] = useState<string[]>([]);
  const [assignedAlumnoIds, setAssignedAlumnoIds] = useState<string[]>([]);
  const [assignTab, setAssignTab] = useState<"pacientes" | "alumnos">("pacientes");
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignProcessing, setAssignProcessing] = useState<string | null>(null);

  /* ── Fetch ── */
  const fetchRutinas = useCallback(async () => {
    try {
      const adminStr = localStorage.getItem("admin");
      const adminId = adminStr ? JSON.parse(adminStr).id : "";
      const res = await fetch(`/api/rutinas${adminId ? `?adminId=${adminId}` : ""}`);
      const data = await res.json();
      if (res.ok) setRutinas(data);
    } catch {
      showToast("Error al cargar rutinas", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEjercicios = useCallback(async () => {
    try {
      const res = await fetch("/api/ejercicios");
      const data = await res.json();
      if (res.ok) setEjerciciosCatalog(data);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchRutinas();
    fetchEjercicios();
  }, [fetchRutinas, fetchEjercicios]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const pid = urlParams.get("pacienteId");
      if (pid) {
        setInitialPacienteId(pid);
        setFormName("");
        setFormDescription("");
        setFormDias([]);
        setFormError("");
        setSelectedRutina(null);
        setModalMode("create");
        window.history.replaceState({}, "", "/rutinas");
      }
    }
  }, []);

  useEffect(() => {
    if (rutinas.length > 0 && typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const editId = urlParams.get("edit");
      if (editId) {
        const toEdit = rutinas.find(r => r.id === editId);
        if (toEdit) {
          openEdit(toEdit);
          window.history.replaceState({}, "", "/rutinas");
        }
      }
    }
  }, [rutinas]);

  const filtered = rutinas.filter((r) => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesUnassigned = filterUnassigned ? !r.pacienteId : true;
    return matchesSearch && matchesUnassigned;
  });

  /* ── Modal helpers ── */
  const resetForm = () => {
    setFormName("");
    setFormDescription("");
    setFormDias([]);
    setFormError("");
  };

  const openCreate = () => {
    resetForm();
    setSelectedRutina(null);
    setModalMode("create");
  };

  const openEdit = (r: Rutina) => {
    setFormName(r.name);
    setFormDescription(r.description);
    setFormDias(
      r.dias.map((d) => ({
        name: d.name,
        ejercicios: d.ejercicios.map((e) => ({
          exerciseId: e.exerciseId,
          sets: e.sets,
          reps: e.reps,
          time: e.time || "",
          intervalo: e.intervalo || "",
          isCircuit: e.isCircuit || false,
        })),
      }))
    );
    setFormError("");
    setSelectedRutina(r);
    setModalMode("edit");
  };

  const openDelete = (r: Rutina) => {
    setSelectedRutina(r);
    setModalMode("delete");
  };

  const openView = (r: Rutina) => {
    setSelectedRutina(r);
    setModalMode("view");
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedRutina(null);
    setFormError("");
    setCreateAssignMode(false);
  };

  /* ── Day / Exercise helpers ── */
  const addDay = () => {
    setFormDias([...formDias, { name: "", ejercicios: [] }]);
  };

  const removeDay = (idx: number) => {
    setFormDias(formDias.filter((_, i) => i !== idx));
  };

  const updateDayName = (idx: number, name: string) => {
    const copy = [...formDias];
    copy[idx] = { ...copy[idx], name };
    setFormDias(copy);
  };

  const openSelectorForDay = (dayIdx: number) => {
    setSelectorDayIdx(dayIdx);
    setSelectorSearch("");
    setSelectorSelectedEx(null);
    setSelectorSets(3);
    setSelectorReps(12);
    setSelectorTime("");
    setSelectorIntervalo("");
    setSelectorIsCircuit(false);
  };

  const closeSelector = () => {
    setSelectorDayIdx(null);
    setSelectorSelectedEx(null);
  };

  const confirmExerciseToDay = () => {
    if (selectorDayIdx === null || !selectorSelectedEx) return;
    const copy = [...formDias];
    copy[selectorDayIdx] = {
      ...copy[selectorDayIdx],
      ejercicios: [
        ...copy[selectorDayIdx].ejercicios,
        {
          exerciseId: selectorSelectedEx.id,
          sets: selectorSets,
          reps: selectorReps,
          time: selectorTime,
          intervalo: selectorIntervalo,
          isCircuit: selectorIsCircuit,
        },
      ],
    };
    setFormDias(copy);
    closeSelector();
  };

  const removeExerciseFromDay = (dayIdx: number, exIdx: number) => {
    const copy = [...formDias];
    copy[dayIdx] = {
      ...copy[dayIdx],
      ejercicios: copy[dayIdx].ejercicios.filter((_, i) => i !== exIdx),
    };
    setFormDias(copy);
  };

  const handleDragStart = (e: React.DragEvent, dayIdx: number, exIdx: number) => {
    setDraggedItem({ dayIdx, exIdx });
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, dayIdx: number, exIdx: number) => {
    e.preventDefault();
    if (!draggedItem) return;
    if (draggedItem.dayIdx === dayIdx && draggedItem.exIdx === exIdx) return;
    setDragOverItem({ dayIdx, exIdx });
  };

  const handleDrop = (e: React.DragEvent, dropDayIdx: number, dropExIdx: number) => {
    e.preventDefault();
    if (!draggedItem) return;

    if (draggedItem.dayIdx === dropDayIdx && draggedItem.exIdx === dropExIdx) {
      setDraggedItem(null);
      setDragOverItem(null);
      return;
    }

    const newFormDias = formDias.map((day) => ({
      ...day,
      ejercicios: [...day.ejercicios]
    }));

    if (draggedItem.dayIdx === dropDayIdx) {
      const dayExercises = [...formDias[draggedItem.dayIdx].ejercicios];
      const [moved] = dayExercises.splice(draggedItem.exIdx, 1);
      dayExercises.splice(dropExIdx, 0, moved);
      newFormDias[draggedItem.dayIdx].ejercicios = dayExercises;
    } else {
      const sourceExercises = [...formDias[draggedItem.dayIdx].ejercicios];
      const targetExercises = [...formDias[dropDayIdx].ejercicios];
      const [moved] = sourceExercises.splice(draggedItem.exIdx, 1);
      targetExercises.splice(dropExIdx, 0, moved);
      newFormDias[draggedItem.dayIdx].ejercicios = sourceExercises;
      newFormDias[dropDayIdx].ejercicios = targetExercises;
    }

    setFormDias(newFormDias);
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const updateExercise = (
    dayIdx: number,
    exIdx: number,
    field: keyof EjercicioEnDia,
    value: string | number | boolean
  ) => {
    const copy = [...formDias];
    const ex = { ...copy[dayIdx].ejercicios[exIdx] };
    if (field === "sets" || field === "reps") {
      ex[field] = Number(value) || 0;
    } else if (field === "isCircuit") {
      ex.isCircuit = value === true || value === "true" || value === 1;
    } else {
      (ex as any)[field] = value;
    }
    copy[dayIdx] = {
      ...copy[dayIdx],
      ejercicios: copy[dayIdx].ejercicios.map((e, i) => (i === exIdx ? ex : e)),
    };
    setFormDias(copy);
  };

  const getEjercicioName = (exerciseId: string) =>
    ejerciciosCatalog.find((e) => e.id === exerciseId)?.name || "Sin nombre";

  /* ── CRUD ── */
  const validateForm = () => {
    if (!formName.trim() || !formDescription.trim()) {
      setFormError("Nombre y descripción son obligatorios.");
      return false;
    }
    for (let i = 0; i < formDias.length; i++) {
      if (!formDias[i].name.trim()) {
        setFormError(`El día ${i + 1} necesita un nombre.`);
        return false;
      }
      for (let j = 0; j < formDias[i].ejercicios.length; j++) {
        if (!formDias[i].ejercicios[j].exerciseId) {
          setFormError(`Seleccioná un ejercicio en el día "${formDias[i].name}", posición ${j + 1}.`);
          return false;
        }
      }
    }
    return true;
  };

  const handleOpenCreateAssign = async () => {
    if (!validateForm()) return;
    setCreateAssignMode(true);
    setFormError("");

    if (allPacientes.length === 0) {
      setAssignLoading(true);
      try {
        const adminStr = localStorage.getItem("admin");
        const adminId = adminStr ? JSON.parse(adminStr).id : "";
        const res = await fetch(`/api/pacientes${adminId ? `?adminId=${adminId}` : ""}`);
        if (res.ok) setAllPacientes(await res.json());
      } catch {
        showToast("Error al cargar pacientes", "error");
      } finally {
        setAssignLoading(false);
      }
    }
  };

  const handleSave = async (pacienteId?: string) => {
    if (!validateForm()) return;

    setSaving(true);
    setFormError("");

    const body: any = {
      name: formName.trim(),
      description: formDescription.trim(),
      dias: formDias.map((d) => ({
        name: d.name.trim(),
        ejercicios: d.ejercicios.map((e) => ({
          exerciseId: e.exerciseId,
          sets: e.sets,
          reps: e.reps,
          time: e.time || null,
          intervalo: e.intervalo || null,
          isCircuit: e.isCircuit || false,
        })),
      })),
    };

    if (pacienteId) {
      body.pacienteId = pacienteId;
    } else if (initialPacienteId) {
      body.pacienteId = initialPacienteId;
    }

    try {
      const url = modalMode === "edit" && selectedRutina
        ? `/api/rutinas/${selectedRutina.id}`
        : "/api/rutinas";
      const method = modalMode === "edit" ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setFormError(data.error || "Error al guardar");
        return;
      }
      showToast(
        modalMode === "create" ? "Rutina creada exitosamente" : "Rutina actualizada",
        "success"
      );
      setInitialPacienteId(null);
      closeModal();
      fetchRutinas();
    } catch {
      setFormError("Error de conexión con el servidor");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRutina) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/rutinas/${selectedRutina.id}`, { method: "DELETE" });
      if (!res.ok) {
        showToast("Error al eliminar la rutina", "error");
        return;
      }
      showToast("Rutina eliminada", "success");
      closeModal();
      fetchRutinas();
    } catch {
      showToast("Error de conexión", "error");
    } finally {
      setSaving(false);
    }
  };

  /* ── Assign ── */
  const openAssign = async (r: Rutina) => {
    setAssignRutina(r);
    setAssignLoading(true);
    try {
      const adminStr = localStorage.getItem("admin");
      const adminId = adminStr ? JSON.parse(adminStr).id : "";

      // Fetch patients, alumnos and assigned IDs in parallel
      const [pacientesRes, alumnosRes, assignedRes] = await Promise.all([
        fetch(`/api/pacientes${adminId ? `?adminId=${adminId}` : ""}`),
        fetch(`/api/alumnos${adminId ? `?adminId=${adminId}` : ""}`),
        fetch(`/api/rutinas/${r.id}/pacientes`),
      ]);
      
      if (pacientesRes.ok) {
        const data = await pacientesRes.json();
        setAllPacientes(data);
      }
      if (alumnosRes.ok) {
        const data = await alumnosRes.json();
        setAllAlumnos(data);
      }
      if (assignedRes.ok) {
        const data = await assignedRes.json();
        setAssignedIds(data.assignedPatientIds || []);
        setAssignedAlumnoIds(data.assignedAlumnoIds || []);
      }
    } catch {
      showToast("Error al cargar datos", "error");
    } finally {
      setAssignLoading(false);
    }
  };

  const closeAssign = () => {
    setAssignRutina(null);
    setAllPacientes([]);
    setAllAlumnos([]);
    setAssignedIds([]);
    setAssignedAlumnoIds([]);
    setAssignTab("pacientes");
  };

  const handleAssignToggle = async (id: string, isCurrentlyAssigned: boolean, type: "paciente" | "alumno") => {
    if (!assignRutina) return;
    setAssignProcessing(id);
    try {
      const body = type === "paciente" ? { pacienteId: id } : { alumnoId: id };
      const res = await fetch(`/api/rutinas/${assignRutina.id}/assign`, {
        method: isCurrentlyAssigned ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        if (type === "paciente") {
          setAssignedIds((prev) => 
            isCurrentlyAssigned ? prev.filter((pid) => pid !== id) : [...prev, id]
          );
        } else {
          setAssignedAlumnoIds((prev) => 
            isCurrentlyAssigned ? prev.filter((aid) => aid !== id) : [...prev, id]
          );
        }
        showToast(isCurrentlyAssigned ? "Rutina desasignada" : "Rutina asignada", "success");
      } else {
        const data = await res.json();
        showToast(data.error || "Error al procesar", "error");
      }
      fetchRutinas();
    } catch {
      showToast("Error de conexión", "error");
    } finally {
      setAssignProcessing(null);
    }
  };

  /* ── Render ── */
  return (
    <>
      {/* Header */}
      <header className="h-16 md:h-20 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 md:px-8 bg-white/50 dark:bg-background-dark/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-4 flex-1 max-w-md">
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
            <input
              className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-white/5 border-none rounded-lg focus:ring-2 focus:ring-primary text-sm outline-none dark:text-white placeholder:text-slate-400"
              placeholder="Buscar rutina..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 md:px-5 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-sm shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all ml-4"
        >
          <span className="material-symbols-outlined text-lg">assignment_add</span>
          <span className="hidden sm:inline">Nueva Rutina</span>
        </button>
      </header>

      {/* Content */}
      <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">Rutinas</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8">
          <div className="bg-white dark:bg-card-dark p-4 md:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3 md:gap-4 hover:border-primary/50 transition-all">
            <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-primary/10 rounded-xl text-primary flex-shrink-0">
              <span className="material-symbols-outlined text-xl md:text-2xl">assignment</span>
            </div>
            <div className="min-w-0">
              <p className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white truncate">{rutinas.length}</p>
              <p className="text-[10px] md:text-xs font-medium text-slate-500 dark:text-slate-400 truncate">Total Rutinas</p>
            </div>
          </div>
          <button
            onClick={() => setFilterUnassigned(!filterUnassigned)}
            className={`p-4 md:p-5 text-left rounded-xl border shadow-sm transition-all flex items-center gap-3 md:gap-4 flex-1 min-w-0 ${filterUnassigned
                ? "bg-amber-500/10 border-amber-500/50 hover:bg-amber-500/20"
                : "bg-white dark:bg-card-dark border-slate-200 dark:border-slate-800 hover:border-amber-500/50 group"
              }`}
          >
            <div className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl flex-shrink-0 transition-colors ${filterUnassigned ? "bg-amber-500/20 text-amber-500" : "bg-amber-500/10 text-amber-500 group-hover:bg-amber-500/20"}`}>
              <span className="material-symbols-outlined text-xl md:text-2xl">link_off</span>
            </div>
            <div className="min-w-0">
              <p className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white truncate">
                {rutinas.filter((r) => !r.pacienteId).length}
              </p>
              <p className="text-[10px] md:text-xs font-medium text-slate-500 dark:text-slate-400 truncate">Sin asignar</p>
            </div>
          </button>
        </div>

        {/* Cards grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Logo animate className="w-12 h-12 text-primary mb-4" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">Cargando rutinas...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-card-dark rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-4xl text-slate-400">
                {searchQuery ? "search_off" : "assignment"}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              {searchQuery ? "Sin resultados" : "No hay rutinas"}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              {searchQuery ? `No se encontraron rutinas para "${searchQuery}"` : "Creá tu primera rutina de rehabilitación"}
            </p>
            {!searchQuery && (
              <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold rounded-xl text-sm shadow-lg shadow-primary/20 transition-all">
                <span className="material-symbols-outlined text-lg">add</span>
                Crear Rutina
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-5">
            {filtered.map((r) => (
              <div
                key={r.id}
                className="bg-white dark:bg-card-dark rounded-xl md:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden group hover:border-primary/40 transition-all"
              >
                {/* Card header */}
                <div className="p-4 md:p-5 pb-3">
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                        <span className="material-symbols-outlined text-lg md:text-xl">assignment</span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">{r.name}</h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {new Date(r.createdAt).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex gap-0.5 mt-0 md:mt-0 transition-opacity flex-shrink-0">
                      <button onClick={() => openAssign(r)} className="p-1.5 md:p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all" title="Asignar pacientes">
                        <span className="material-symbols-outlined text-[18px] md:text-[20px]">person_add</span>
                      </button>
                      <button onClick={() => openView(r)} className="p-1.5 md:p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all" title="Ver">
                        <span className="material-symbols-outlined text-[18px] md:text-[20px]">visibility</span>
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">{r.description}</p>

                  {/* Stats pills */}
                  <div className="flex gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-bold rounded-lg">
                      <span className="material-symbols-outlined text-xs">calendar_view_day</span>
                      {r.dias.length} {r.dias.length === 1 ? "día" : "días"}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-lg">
                      <span className="material-symbols-outlined text-xs">fitness_center</span>
                      {r.dias.reduce((acc, d) => acc + d.ejercicios.length, 0)} ejercicios
                    </span>
                    {r.paciente && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-lg">
                        <span className="material-symbols-outlined text-xs">person</span>
                        {r.paciente.fullName}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== MODAL ===== */}
      {modalMode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]"
          onClick={closeModal}
        >
          <div
            className={`bg-white dark:bg-card-dark w-full rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl shadow-black/40 overflow-hidden animate-[slideUp_0.3s_ease-out] flex flex-col ${modalMode === "delete" ? "max-w-md" : "max-w-3xl max-h-[90vh]"
              }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Delete ── */}
            {modalMode === "delete" && selectedRutina && (
              <>
                <div className="p-6 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-red-500 text-3xl">delete_forever</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Eliminar Rutina</h3>
                  {/* <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">Estás por eliminar</p> */}
                  <p className="text-primary font-bold mb-3">&quot;{selectedRutina.name}&quot;</p>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">¿Estás seguro?</p>


                  {/* <p className="text-xs text-slate-400 dark:text-slate-500">Se eliminarán también todos sus días y ejercicios asociados.</p> */}
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
            {modalMode === "view" && selectedRutina && (
              <>
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">assignment</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selectedRutina.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{selectedRutina.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => { closeModal(); openEdit(selectedRutina); }} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all" title="Editar">
                      <span className="material-symbols-outlined">edit</span>
                    </button>
                    <button onClick={() => { closeModal(); openDelete(selectedRutina); }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all" title="Eliminar">
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                    <button onClick={closeModal} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-all">
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {selectedRutina.dias.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">Esta rutina no tiene días configurados.</p>
                  ) : (
                    selectedRutina.dias.map((dia, dIdx) => (
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
                              <div key={eIdx} className="px-4 py-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <span className="material-symbols-outlined text-primary text-lg">fitness_center</span>
                                  <span className="text-sm font-medium text-slate-900 dark:text-white">{getEjercicioName(ej.exerciseId)}</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs">
                                  {ej.isCircuit && <img src="/rayo.svg" alt="⚡" className="w-4 h-4" />}
                                  <span className="px-2 py-1 bg-primary/10 text-primary rounded-lg font-bold">{ej.sets} sets</span>
                                  <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded-lg font-bold">{ej.reps} reps</span>
                                  {ej.time && <span className="px-2 py-1 bg-amber-500/10 text-amber-400 rounded-lg font-bold">{ej.time}</span>}
                                  {ej.intervalo && <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg font-bold">{ej.intervalo}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {/* ── Create / Edit ── */}
            {(modalMode === "create" || modalMode === "edit") && (
              <>
                {createAssignMode ? (
                  <>
                    <div className="p-5 md:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
                      <div className="flex items-center gap-3">
                        <button onClick={() => setCreateAssignMode(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-all" title="Volver">
                          <span className="material-symbols-outlined">arrow_back</span>
                        </button>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Seleccionar Paciente</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Asigná la rutina a un paciente existente</p>
                        </div>
                      </div>
                      <button onClick={closeModal} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-all">
                        <span className="material-symbols-outlined">close</span>
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 md:p-6">
                      {assignLoading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                          <Logo animate className="w-10 h-10 text-primary mb-3" />
                          <p className="text-sm text-slate-500 dark:text-slate-400">Cargando pacientes...</p>
                        </div>
                      ) : allPacientes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                          <span className="material-symbols-outlined text-4xl text-slate-400 mb-3">groups</span>
                          <p className="text-sm text-slate-500 dark:text-slate-400">No hay pacientes registrados</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {allPacientes.map((p) => (
                            <button
                              key={p.id}
                              onClick={() => {
                                setAssignProcessing(p.id);
                                handleSave(p.id);
                              }}
                              disabled={saving}
                              className={`w-full text-left p-3 md:p-4 rounded-xl border flex items-center justify-between transition-all ${assignProcessing === p.id
                                  ? 'border-primary bg-primary/5'
                                  : 'border-slate-200 dark:border-slate-800 hover:border-primary/40 dark:hover:border-primary/40 bg-slate-50 dark:bg-white/[0.03]'
                                } disabled:opacity-50`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 font-bold uppercase text-sm">
                                  {p.fullName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{p.fullName}</p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">DNI: {p.dni}</p>
                                </div>
                              </div>
                              <div className="ml-2 flex flex-shrink-0 items-center justify-center">
                                {assignProcessing === p.id ? (
                                  <Logo animate className="w-5 h-5 text-primary" />
                                ) : (
                                  <span className="material-symbols-outlined text-primary">arrow_forward_ios</span>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Header */}
                    <div className="p-5 md:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                          <span className="material-symbols-outlined">{modalMode === "create" ? "add_circle" : "edit"}</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                            {modalMode === "create" ? "Nueva Rutina" : "Editar Rutina"}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {modalMode === "create" ? "Creá una rutina con días y ejercicios" : `Editando: ${selectedRutina?.name}`}
                          </p>
                        </div>
                      </div>
                      <button onClick={closeModal} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-all">
                        <span className="material-symbols-outlined">close</span>
                      </button>
                    </div>

                    {/* Scrollable body */}
                    <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-5">
                      {formError && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm">error</span>
                          {formError}
                        </div>
                      )}

                      {/* Name */}
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 pl-1">Nombre de la Rutina</label>
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">assignment</span>
                          <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Ej: Rehabilitación Manguito Rotador" className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/40 focus:border-primary/50 outline-none transition-all dark:text-white placeholder:text-slate-400" />
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 pl-1">Descripción</label>
                        <textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Describe el objetivo de esta rutina..." rows={2} className="w-full px-4 py-3.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/40 focus:border-primary/50 outline-none transition-all dark:text-white placeholder:text-slate-400 resize-none" />
                      </div>

                      {/* Days section */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 pl-1">
                            Días de la Rutina ({formDias.length})
                          </label>
                          <button
                            type="button"
                            onClick={addDay}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-lg hover:bg-primary/20 transition-all"
                          >
                            <span className="material-symbols-outlined text-sm">add</span>
                            Agregar Día
                          </button>
                        </div>

                        {formDias.length === 0 && (
                          <div className="text-center py-8 bg-slate-50 dark:bg-white/[0.02] rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                            <span className="material-symbols-outlined text-3xl text-slate-400 mb-2">calendar_add_on</span>
                            <p className="text-xs text-slate-400">Hacé click en &quot;Agregar Día&quot; para comenzar</p>
                          </div>
                        )}

                        <div className="space-y-4">
                          {formDias.map((dia, dIdx) => (
                            <div key={dIdx} className="bg-slate-50 dark:bg-white/[0.03] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                              {/* Day header */}
                              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
                                <span className="w-7 h-7 rounded-lg bg-primary text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                                  {dIdx + 1}
                                </span>
                                <input
                                  type="text"
                                  value={dia.name}
                                  onChange={(e) => updateDayName(dIdx, e.target.value)}
                                  placeholder={`Ej: Lunes - Movilidad`}
                                  className="flex-1 bg-transparent border-none text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-0"
                                />
                                <button
                                  onClick={() => removeDay(dIdx)}
                                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                  title="Eliminar día"
                                >
                                  <span className="material-symbols-outlined text-[18px]">close</span>
                                </button>
                              </div>

                              {/* Exercises list */}
                              <div className="p-4 space-y-3">
                                {dia.ejercicios.map((ex, eIdx) => (
                                  <div
                                    key={eIdx}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, dIdx, eIdx)}
                                    onDragOver={(e) => handleDragOver(e, dIdx, eIdx)}
                                    onDrop={(e) => handleDrop(e, dIdx, eIdx)}
                                    onDragEnd={handleDragEnd}
                                    className={`flex flex-wrap items-center gap-2 p-3 rounded-xl border transition-all ${
                                      draggedItem?.dayIdx === dIdx && draggedItem?.exIdx === eIdx
                                        ? "opacity-50 border-primary border-dashed bg-primary/5"
                                        : dragOverItem?.dayIdx === dIdx && dragOverItem?.exIdx === eIdx
                                        ? "border-primary bg-primary/10 scale-[1.02] shadow-lg"
                                        : "bg-white dark:bg-card-dark border-slate-200 dark:border-slate-700"
                                    }`}
                                  >
                                    <div className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-primary transition-colors pr-1 flex items-center justify-center">
                                      <span className="material-symbols-outlined text-[20px]">drag_indicator</span>
                                    </div>
                                    
                                    {/* Exercise Display */}
                                    <div className="flex-1 min-w-[200px] flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                                        <span className="material-symbols-outlined">fitness_center</span>
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                          {getEjercicioName(ex.exerciseId)}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Sets */}
                                    <div className="flex flex-col items-center gap-1">
                                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Sets</label>
                                      <input
                                        type="number"
                                        min={1}
                                        value={ex.sets}
                                        onChange={(e) => updateExercise(dIdx, eIdx, "sets", e.target.value)}
                                        className="w-16 px-2 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-center font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-sm hover:border-primary/30"
                                      />
                                    </div>

                                    {/* Reps */}
                                    <div className="flex flex-col items-center gap-1">
                                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Reps</label>
                                      <input
                                        type="number"
                                        min={1}
                                        value={ex.reps}
                                        onChange={(e) => updateExercise(dIdx, eIdx, "reps", e.target.value)}
                                        className="w-16 px-2 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-center font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-sm hover:border-primary/30"
                                      />
                                    </div>

                                    {/* Time */}
                                    <div className="flex flex-col items-center gap-1">
                                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Tiempo</label>
                                      <input
                                        type="text"
                                        value={ex.time}
                                        onChange={(e) => updateExercise(dIdx, eIdx, "time", e.target.value)}
                                        placeholder="45s"
                                        className="w-20 px-2 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-center font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-slate-400 placeholder:font-normal transition-all shadow-sm hover:border-primary/30"
                                      />
                                    </div>

                                    {/* Intervalo */}
                                    <div className="flex flex-col items-center gap-1">
                                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Intervalo</label>
                                      <input
                                        type="text"
                                        value={ex.intervalo}
                                        onChange={(e) => updateExercise(dIdx, eIdx, "intervalo", e.target.value)}
                                        placeholder="60s"
                                        className="w-20 px-2 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-center font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-slate-400 placeholder:font-normal transition-all shadow-sm hover:border-primary/30"
                                      />
                                    </div>

                                    {/* isCircuit toggle */}
                                    <div className="flex flex-col items-center gap-1">
                                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Circuito</label>
                                      <button
                                        type="button"
                                        onClick={() => updateExercise(dIdx, eIdx, "isCircuit", !ex.isCircuit)}
                                        className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-all shadow-sm ${ex.isCircuit ? 'bg-yellow-500/20 border-yellow-500/50' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-primary/30'}`}
                                        title={ex.isCircuit ? "Quitar circuito" : "Marcar como circuito"}
                                      >
                                        {ex.isCircuit ? <img src="/rayo.svg" alt="⚡" className="w-5 h-5" /> : <span className="material-symbols-outlined text-slate-400 text-[18px]">bolt</span>}
                                      </button>
                                    </div>

                                    {/* Remove */}
                                    <button
                                      onClick={() => removeExerciseFromDay(dIdx, eIdx)}
                                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all ml-auto"
                                    >
                                      <span className="material-symbols-outlined text-[18px]">remove_circle</span>
                                    </button>
                                  </div>
                                ))}

                                <button
                                  onClick={() => openSelectorForDay(dIdx)}
                                  className="w-full py-2.5 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-1.5"
                                >
                                  <span className="material-symbols-outlined text-sm">add</span>
                                  Agregar ejercicio al {dia.name || `Día ${dIdx + 1}`}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}
                {/* Footer */}
                {createAssignMode ? null : (
                  <div className="flex flex-col sm:flex-row gap-3 p-6 border-t border-slate-200 dark:border-slate-800 flex-shrink-0">
                    <button onClick={closeModal} className="flex-1 py-3.5 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-white/10 transition-all">
                      Cancelar
                    </button>
                    {modalMode === "create" ? (
                      <>
                        <button
                          onClick={() => handleSave()}
                          disabled={saving}
                          className="flex-1 py-3.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                        >
                          {saving ? "Guardando..." : "Guardar sin asignar"}
                        </button>
                        <button
                          onClick={handleOpenCreateAssign}
                          disabled={saving}
                          className="flex-1 py-3.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <span className="material-symbols-outlined text-lg">person_add</span>
                          Asignar Paciente
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleSave()}
                        disabled={saving}
                        className="flex-1 py-3.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                      >
                        {saving ? (
                          <Logo animate className="w-5 h-5 text-current" />
                        ) : (
                          <span className="material-symbols-outlined text-lg">save</span>
                        )}
                        {saving ? "Guardando..." : "Guardar Cambios"}
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ===== ASSIGN MODAL ===== */}
      {assignRutina && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]" onClick={closeAssign}>
          <div className="bg-white dark:bg-card-dark w-full max-w-lg max-h-[85vh] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl shadow-black/40 overflow-hidden animate-[slideUp_0.3s_ease-out] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="p-5 md:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 flex-shrink-0">
                  <span className="material-symbols-outlined">person_add</span>
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Asignar Rutina</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Rutina: {assignRutina.name}</p>
                </div>
              </div>
              <button onClick={closeAssign} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-all flex-shrink-0">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex p-2 gap-1 bg-slate-100 dark:bg-white/5 border-b border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setAssignTab("pacientes")}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  assignTab === "pacientes"
                    ? "bg-white dark:bg-card-dark text-primary shadow-sm"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                Pacientes
              </button>
              <button
                onClick={() => setAssignTab("alumnos")}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  assignTab === "alumnos"
                    ? "bg-white dark:bg-card-dark text-primary shadow-sm"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                Alumnos
              </button>
            </div>

            {/* User list */}
            <div className="flex-1 overflow-y-auto p-5 md:p-6">
              {assignLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Logo animate className="w-10 h-10 text-primary mb-3" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">Cargando {assignTab}...</p>
                </div>
              ) : (assignTab === "pacientes" ? allPacientes : allAlumnos).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-3">
                    <span className="material-symbols-outlined text-3xl text-slate-400">groups</span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">No hay {assignTab} registrados</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {(assignTab === "pacientes" ? allPacientes : allAlumnos).map((u) => {
                    const isAssigned = assignTab === "pacientes" 
                      ? assignedIds.includes(u.id) 
                      : assignedAlumnoIds.includes(u.id);
                    const isProcessing = assignProcessing === u.id;
                    return (
                      <div
                        key={u.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isAssigned
                            ? "bg-emerald-500/5 border-emerald-500/30"
                            : "bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                          }`}
                      >
                        {/* Avatar */}
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold uppercase flex-shrink-0 ${isAssigned ? "bg-emerald-500/15 text-emerald-500" : "bg-primary/10 text-primary"
                          }`}>
                          {u.fullName.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{u.fullName}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">DNI: {u.dni}</p>
                        </div>

                        {/* Status badge */}
                        {!u.isActive && (
                          <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-amber-500/10 text-amber-500 flex-shrink-0">Alta</span>
                        )}

                        {/* Toggle button */}
                        <button
                          onClick={() => handleAssignToggle(u.id, isAssigned, assignTab === "pacientes" ? "paciente" : "alumno")}
                          disabled={isProcessing}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 flex-shrink-0 ${isAssigned
                              ? "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                              : "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                            }`}
                        >
                          {isProcessing ? (
                            <Logo animate className="w-4 h-4 text-current" />
                          ) : (
                            <span className="material-symbols-outlined text-sm">{isAssigned ? "person_remove" : "person_add"}</span>
                          )}
                          {isProcessing ? "..." : isAssigned ? "Quitar" : "Asignar"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer with summary */}
            <div className="p-5 md:p-6 border-t border-slate-200 dark:border-slate-800 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="text-emerald-500 font-bold">{assignedIds.length}</span> pacientes
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="text-primary font-bold">{assignedAlumnoIds.length}</span> alumnos
                  </p>
                </div>
                <button onClick={closeAssign} className="px-5 py-2.5 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-white/10 transition-all">
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== EXERCISE SELECTOR MODAL ===== */}
      {selectorDayIdx !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]" onClick={closeSelector}>
          <div className="bg-white dark:bg-card-dark w-full max-w-4xl max-h-[90vh] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl shadow-black/40 flex flex-col overflow-hidden animate-[slideUp_0.3s_ease-out]" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 md:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Seleccionar Ejercicio</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Día {selectorDayIdx + 1}</p>
              </div>
              <button onClick={closeSelector} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-all">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            {!selectorSelectedEx ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-white/[0.02]">
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                    <input
                      className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary text-sm outline-none dark:text-white placeholder:text-slate-400 transition-all"
                      placeholder="Buscar por nombre o categoría..."
                      value={selectorSearch}
                      onChange={(e) => setSelectorSearch(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                    {ejerciciosCatalog.filter((e) => {
                      const q = selectorSearch.toLowerCase();
                      return e.name.toLowerCase().includes(q) || (e.categories && e.categories.some(c => c.toLowerCase().includes(q)));
                    }).map((ej) => (
                      <button
                        key={ej.id}
                        onClick={() => setSelectorSelectedEx(ej)}
                        className="text-left bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-700 rounded-xl p-3 hover:border-primary/50 hover:shadow-md transition-all group flex flex-col gap-2"
                      >
                        <div className="w-full aspect-video bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden flex items-center justify-center relative">
                          {ej.videoUrl ? (
                            <>
                              <ExerciseVideo url={ej.videoUrl} thumbnailMode={true} videoClassName="opacity-80 group-hover:opacity-100 transition-opacity" />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white">
                                  <span className="material-symbols-outlined text-sm">play_arrow</span>
                                </div>
                              </div>
                            </>
                          ) : (
                            <span className="material-symbols-outlined text-3xl text-slate-300 dark:text-slate-600">fitness_center</span>
                          )}
                        </div>
                        <div className="min-w-0 w-full">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{ej.name}</h4>
                          {ej.categories && ej.categories.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {ej.categories.slice(0, 3).map(c => (
                                <span key={c} className="text-[9px] px-1.5 py-0.5 bg-primary/10 text-primary font-bold rounded-md truncate max-w-full">{c}</span>
                              ))}
                              {ej.categories.length > 3 && <span className="text-[9px] px-1.5 py-0.5 text-slate-500">+{ej.categories.length - 3}</span>}
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center max-w-sm mx-auto w-full">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-3xl">fitness_center</span>
                </div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-6 text-center">{selectorSelectedEx.name}</h4>
                
                <div className="w-full space-y-4 mb-8">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Series (Sets)</label>
                    <input type="number" min={1} value={selectorSets} onChange={(e) => setSelectorSets(Number(e.target.value))} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-center font-bold text-lg dark:text-white outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Repeticiones (Reps)</label>
                    <input type="number" min={1} value={selectorReps} onChange={(e) => setSelectorReps(Number(e.target.value))} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-center font-bold text-lg dark:text-white outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Tiempo (opcional)</label>
                    <input type="text" placeholder="Ej: 45s" value={selectorTime} onChange={(e) => setSelectorTime(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-center font-bold text-lg dark:text-white outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Intervalo (opcional)</label>
                    <input type="text" placeholder="Ej: 60s" value={selectorIntervalo} onChange={(e) => setSelectorIntervalo(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-center font-bold text-lg dark:text-white outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Ejercicio de Circuito</label>
                    <button
                      type="button"
                      onClick={() => setSelectorIsCircuit(!selectorIsCircuit)}
                      className={`w-full py-3 rounded-xl border font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                        selectorIsCircuit
                          ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-primary/30'
                      }`}
                    >
                      {selectorIsCircuit ? <img src="/rayo.svg" alt="⚡" className="w-5 h-5" /> : <span className="material-symbols-outlined text-lg">bolt</span>}
                      {selectorIsCircuit ? 'Circuito activado' : 'Activar circuito'}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 w-full mt-auto">
                  <button onClick={() => setSelectorSelectedEx(null)} className="flex-1 py-3 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 transition-all">Volver</button>
                  <button onClick={confirmExerciseToDay} className="flex-1 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold shadow-lg shadow-primary/20 transition-all">Agregar</button>
                </div>
              </div>
            )}
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
