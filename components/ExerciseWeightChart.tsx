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

interface ExerciseWeightChartProps {
  exerciseId: string;
  ejercicioEnDiaId?: string;
  pacienteId?: string;
  alumnoId?: string;
  exerciseName?: string;
  onWeightDeleted?: (newWeight: number) => void;
}

type Timeframe = "sesiones" | "semanas" | "meses" | "anios";

interface ChartDataItem {
  label: string;
  weight: number;
  count: number;
}

interface RawLogItem {
  id: string;
  weight: number;
  date: string;
}

interface SummaryData {
  current: number;
  avg: number;
  max: number;
  totalLogs: number;
}

export default function ExerciseWeightChart({
  exerciseId,
  ejercicioEnDiaId,
  pacienteId,
  alumnoId,
  exerciseName,
  onWeightDeleted,
}: ExerciseWeightChartProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>("sesiones");
  const [data, setData] = useState<ChartDataItem[]>([]);
  const [rawLogs, setRawLogs] = useState<RawLogItem[]>([]);
  const [summary, setSummary] = useState<SummaryData>({
    current: 0,
    avg: 0,
    max: 0,
    totalLogs: 0,
  });
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams();
      if (exerciseId) params.append("exerciseId", exerciseId);
      if (ejercicioEnDiaId) params.append("ejercicioEnDiaId", ejercicioEnDiaId);
      if (pacienteId) params.append("pacienteId", pacienteId);
      if (alumnoId) params.append("alumnoId", alumnoId);
      params.append("timeframe", timeframe);

      const res = await fetch(`/api/ejercicios/peso-progreso?${params.toString()}`);
      if (!res.ok) throw new Error("Error al obtener datos");
      const json = await res.json();
      setData(json.data || []);
      setRawLogs(json.rawLogs || []);
      setSummary(
        json.summary || { current: 0, avg: 0, max: 0, totalLogs: 0 }
      );
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [exerciseId, ejercicioEnDiaId, pacienteId, alumnoId, timeframe]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDeleteLog = async (logId: string) => {
    if (!confirm("¿Estás seguro de que querés eliminar este registro de peso?")) return;
    setDeletingId(logId);
    try {
      const res = await fetch(`/api/ejercicios/peso?logId=${logId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const json = await res.json();
        // Refresh chart & list
        await fetchData();
        // If parent has a callback, notify the new weight
        if (onWeightDeleted) {
          onWeightDeleted(json.newWeight || 0);
        }
      } else {
        alert("Error al eliminar el registro");
      }
    } catch {
      alert("Error de conexión");
    } finally {
      setDeletingId(null);
    }
  };

  const timeframeLabels: Record<Timeframe, string> = {
    sesiones: "Sesiones",
    semanas: "Semanas",
    meses: "Meses",
    anios: "Años",
  };

  return (
    <div className="bg-card-dark/80 border border-slate-800 rounded-2xl p-4 md:p-5 space-y-4">
      {/* Header & Timeframe Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">
              show_chart
            </span>
            <span>Progreso de Peso</span>
            {exerciseName && (
              <span className="text-slate-400 font-normal">
                · {exerciseName}
              </span>
            )}
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Evolución del peso en kg cargado en cada entrenamiento
          </p>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          {(["sesiones", "semanas", "meses", "anios"] as Timeframe[]).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                timeframe === tf
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              {timeframeLabels[tf]}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">
            Último Peso
          </span>
          <span className="text-lg font-black text-white">
            {summary.current} <span className="text-xs font-normal text-primary">kg</span>
          </span>
        </div>
        <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">
            Promedio ({timeframeLabels[timeframe]})
          </span>
          <span className="text-lg font-black text-emerald-400">
            {summary.avg} <span className="text-xs font-normal text-emerald-500">kg</span>
          </span>
        </div>
        <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">
            Máximo
          </span>
          <span className="text-lg font-black text-amber-400">
            {summary.max} <span className="text-xs font-normal text-amber-500">kg</span>
          </span>
        </div>
        <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">
            Total Muestras
          </span>
          <span className="text-lg font-black text-slate-300">
            {summary.totalLogs}
          </span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 w-full pt-2">
        {loading && data.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
            <span className="material-symbols-outlined text-2xl animate-spin text-primary mb-2">
              sync
            </span>
            Cargando gráfico...
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center text-red-400 text-xs">
            Error al obtener el historial de peso
          </div>
        ) : data.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl p-4 text-center">
            <span className="material-symbols-outlined text-3xl text-slate-600 mb-1">
              monitoring
            </span>
            <span>Aún no hay registros de peso cargados para este ejercicio.</span>
            <span className="text-[11px] text-slate-600 mt-1">
              Ingresá el peso y guardalo para comenzar a ver el gráfico.
            </span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 10, right: 15, left: -20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="label"
                stroke="#64748b"
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke="#64748b"
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                unit=" kg"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "12px",
                  fontSize: "12px",
                  color: "#fff",
                }}
                formatter={(value: any) => [
                  `${value} kg`,
                  timeframe === "sesiones" ? "Peso" : "Peso Promedio",
                ]}
                labelStyle={{ fontWeight: "bold", color: "#f97316" }}
              />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#f97316"
                strokeWidth={3}
                dot={{ fill: "#f97316", r: 4 }}
                activeDot={{ r: 6, fill: "#fff", stroke: "#f97316", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Raw Logs List to allow Deletion */}
      {rawLogs.length > 0 && (
        <div className="border-t border-slate-800/80 pt-4 space-y-2">
          <h5 className="text-xs font-bold text-slate-400 flex items-center gap-1.5 mb-2.5">
            <span className="material-symbols-outlined text-[16px] text-slate-500">history</span>
            <span>Historial de Registros</span>
          </h5>
          <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
            {rawLogs.slice().reverse().map((log) => {
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
                  className="flex items-center justify-between p-2 bg-slate-900/40 hover:bg-slate-900/70 border border-slate-800/60 rounded-xl transition-all text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-md">
                      {log.weight} kg
                    </span>
                    <span className="text-slate-400">{dateStr}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteLog(log.id)}
                    disabled={deletingId === log.id}
                    className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center justify-center"
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
      )}
    </div>
  );
}
