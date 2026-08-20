"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import Logo from "./Logo";

interface RunningLogsSectionProps {
  pacienteId?: string;
  alumnoId?: string;
}

interface RunningLog {
  id: string;
  distanceEnKM: number;
  velocity: string;
  timeEnMin: number;
  date: string;
}

export default function RunningLogsSection({ pacienteId, alumnoId }: RunningLogsSectionProps) {
  const [logs, setLogs] = useState<RunningLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState(false);

  // Form state
  const [distance, setDistance] = useState("");
  const [time, setTime] = useState("");
  const [velocity, setVelocity] = useState("");
  const [formError, setFormError] = useState("");

  // Chart state
  const [yMetric, setYMetric] = useState<"distance" | "time">("distance");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams();
      if (pacienteId) params.append("pacienteId", pacienteId);
      if (alumnoId) params.append("alumnoId", alumnoId);

      const res = await fetch(`/api/running?${params.toString()}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLogs(data || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [pacienteId, alumnoId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!distance || !time || !velocity.trim()) {
      setFormError("Todos los campos son obligatorios.");
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      const res = await fetch("/api/running", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pacienteId,
          alumnoId,
          distanceEnKM: parseFloat(distance),
          timeEnMin: parseFloat(time),
          velocity: velocity.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al guardar");
      }

      setDistance("");
      setTime("");
      setVelocity("");
      await fetchLogs();
    } catch (err: any) {
      setFormError(err.message || "Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (logId: string) => {
    if (!confirm("¿Estás seguro de que querés eliminar esta sesión de running?")) return;
    setDeletingId(logId);
    try {
      const res = await fetch(`/api/running?logId=${logId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchLogs();
      } else {
        alert("Error al eliminar el registro");
      }
    } catch {
      alert("Error de conexión");
    } finally {
      setDeletingId(null);
    }
  };

  const chartData = logs.map((log, index) => {
    const d = new Date(log.date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    return {
      ...log,
      label: `#${index + 1} (${day}/${month})`,
      dateFormatted: d.toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
    };
  });

  return (
    <div className="bg-card-dark border border-slate-800 rounded-2xl p-4 md:p-5 space-y-6">
      {/* Title */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
          <span className="material-symbols-outlined">directions_run</span>
        </div>
        <div>
          <h3 className="text-white font-bold text-base leading-none">Sesiones de Running</h3>
          <p className="text-xs text-slate-500 mt-1">Registrá y hacé seguimiento de tus carreras</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="space-y-3 bg-slate-900/40 p-4 rounded-xl border border-slate-800/80">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Registrar nueva sesión</h4>
        {formError && (
          <p className="text-xs text-red-400 font-medium bg-red-500/10 p-2 rounded-lg border border-red-500/20">{formError}</p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Distancia (km)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Ej: 5.2"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary/40 outline-none text-white placeholder:text-slate-600"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Tiempo (min)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              placeholder="Ej: 30.5"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary/40 outline-none text-white placeholder:text-slate-600"
            />
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Velocidad / Ritmo</label>
          <input
            type="text"
            placeholder="Ej: 10 km/h o 5:30 min/km"
            value={velocity}
            onChange={(e) => setVelocity(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary/40 outline-none text-white placeholder:text-slate-600"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="w-full py-2.5 bg-gradient-to-r from-primary to-orange-500 hover:from-primary/95 hover:to-orange-500/95 text-white font-bold rounded-xl text-xs shadow-lg shadow-primary/10 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          {saving ? (
            <>
              <Logo animate className="w-4 h-4 text-current" />
              <span>Guardando...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-sm">add</span>
              <span>Guardar Sesión</span>
            </>
          )}
        </button>
      </form>

      {/* Chart Eje Y Toggle & Plot */}
      {logs.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-base">show_chart</span>
              <span>Gráfico de Progreso</span>
            </h4>
            
            {/* Metric Toggle */}
            <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setYMetric("distance")}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${
                  yMetric === "distance"
                    ? "bg-primary text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Distancia
              </button>
              <button
                type="button"
                onClick={() => setYMetric("time")}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${
                  yMetric === "time"
                    ? "bg-primary text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Tiempo
              </button>
            </div>
          </div>

          {/* Recharts Canvas */}
          <div className="h-56 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 15, left: -22, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="label"
                  stroke="#64748b"
                  tick={{ fontSize: 9, fill: "#94a3b8" }}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fontSize: 9, fill: "#94a3b8" }}
                  unit={yMetric === "distance" ? " km" : " m"}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "12px",
                    fontSize: "11px",
                    color: "#fff",
                  }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl space-y-1 text-xs">
                          <p className="font-bold text-orange-400 mb-1">{data.dateFormatted}</p>
                          <p className="text-white">
                            <span className="text-slate-400">Distancia:</span> {data.distanceEnKM} km
                          </p>
                          <p className="text-white">
                            <span className="text-slate-400">Tiempo:</span> {data.timeEnMin} min
                          </p>
                          <p className="text-white">
                            <span className="text-slate-400">Ritmo/Velocidad:</span> {data.velocity}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey={yMetric === "distance" ? "distanceEnKM" : "timeEnMin"}
                  stroke="#f97316"
                  strokeWidth={2.5}
                  dot={{ fill: "#f97316", r: 3 }}
                  activeDot={{ r: 5, fill: "#fff", stroke: "#f97316", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* History logs with deletion */}
      {logs.length > 0 ? (
        <div className="border-t border-slate-800/80 pt-4 space-y-2">
          <h4 className="text-xs font-bold text-slate-400 flex items-center gap-1.5 mb-2">
            <span className="material-symbols-outlined text-slate-500 text-sm">history</span>
            <span>Sesiones Anteriores</span>
          </h4>
          <div className="max-h-48 overflow-y-auto space-y-2 pr-1 no-scrollbar">
            {logs.slice().reverse().map((log) => {
              const d = new Date(log.date);
              const dateStr = d.toLocaleDateString("es-AR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });
              return (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 bg-slate-900/30 hover:bg-slate-900/60 border border-slate-800/80 rounded-xl transition-all text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded">
                        {log.distanceEnKM} km
                      </span>
                      <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                        {log.timeEnMin} min
                      </span>
                      <span className="text-slate-400 font-semibold italic">
                        {log.velocity}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500">{dateStr}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(log.id)}
                    disabled={deletingId === log.id}
                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center justify-center shrink-0"
                    title="Eliminar registro"
                  >
                    {deletingId === log.id ? (
                      <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                    ) : (
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        !loading && (
          <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
            <span className="material-symbols-outlined text-2xl mb-1 text-slate-600 block">monitoring</span>
            Aún no hay carreras registradas.
          </div>
        )
      )}
    </div>
  );
}
