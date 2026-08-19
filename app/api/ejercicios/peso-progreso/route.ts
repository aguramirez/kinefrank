import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const exerciseId = searchParams.get('exerciseId');
    const ejercicioEnDiaId = searchParams.get('ejercicioEnDiaId');
    const pacienteId = searchParams.get('pacienteId');
    const alumnoId = searchParams.get('alumnoId');
    const timeframe = searchParams.get('timeframe') || 'sesiones'; // 'sesiones' | 'semanas' | 'meses' | 'anios'

    let targetExerciseId = exerciseId;

    if (!targetExerciseId && ejercicioEnDiaId) {
      const ejEnDia = await prisma.ejercicioEnDia.findUnique({
        where: { id: ejercicioEnDiaId },
        select: { exerciseId: true }
      });
      if (ejEnDia) {
        targetExerciseId = ejEnDia.exerciseId;
      }
    }

    if (!targetExerciseId) {
      return NextResponse.json({ error: 'exerciseId o ejercicioEnDiaId es requerido' }, { status: 400 });
    }

    // Build filter where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      exerciseId: targetExerciseId,
    };

    if (pacienteId) where.pacienteId = pacienteId;
    if (alumnoId) where.alumnoId = alumnoId;

    const logs = await prisma.ejercicioPesoLog.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    if (logs.length === 0) {
      return NextResponse.json({ data: [], summary: { current: 0, avg: 0, max: 0, totalLogs: 0 } }, { status: 200 });
    }

    // Summary metrics
    const weights = logs.map((l) => l.weight);
    const current = weights[weights.length - 1] ?? 0;
    const max = Math.max(...weights);
    const avg = Math.round((weights.reduce((a, b) => a + b, 0) / weights.length) * 10) / 10;

    // Helper functions for grouping
    const getWeekKey = (date: Date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
      const monday = new Date(d.setDate(diff));
      const year = monday.getFullYear();
      const month = String(monday.getMonth() + 1).padStart(2, '0');
      const dayStr = String(monday.getDate()).padStart(2, '0');
      return {
        key: `${year}-${month}-${dayStr}`,
        label: `Sem ${dayStr}/${month}/${String(year).slice(-2)}`,
        timestamp: monday.getTime(),
      };
    };

    const getMonthKey = (date: Date) => {
      const d = new Date(date);
      const year = d.getFullYear();
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const monthName = monthNames[d.getMonth()];
      return {
        key: `${year}-${d.getMonth()}`,
        label: `${monthName} ${year}`,
        timestamp: new Date(year, d.getMonth(), 1).getTime(),
      };
    };

    const getYearKey = (date: Date) => {
      const d = new Date(date);
      const year = d.getFullYear();
      return {
        key: `${year}`,
        label: `${year}`,
        timestamp: new Date(year, 0, 1).getTime(),
      };
    };

    // Grouping according to timeframe
    let chartData: { label: string; weight: number; count: number; date: Date }[] = [];

    if (timeframe === 'semanas') {
      const groups = new Map<string, { label: string; sum: number; count: number; date: Date }>();
      for (const log of logs) {
        const { key, label, timestamp } = getWeekKey(new Date(log.date));
        if (!groups.has(key)) {
          groups.set(key, { label, sum: 0, count: 0, date: new Date(timestamp) });
        }
        const grp = groups.get(key)!;
        grp.sum += log.weight;
        grp.count += 1;
      }
      chartData = Array.from(groups.values()).map((g) => ({
        label: g.label,
        weight: Math.round((g.sum / g.count) * 10) / 10,
        count: g.count,
        date: g.date,
      }));
    } else if (timeframe === 'meses') {
      const groups = new Map<string, { label: string; sum: number; count: number; date: Date }>();
      for (const log of logs) {
        const { key, label, timestamp } = getMonthKey(new Date(log.date));
        if (!groups.has(key)) {
          groups.set(key, { label, sum: 0, count: 0, date: new Date(timestamp) });
        }
        const grp = groups.get(key)!;
        grp.sum += log.weight;
        grp.count += 1;
      }
      chartData = Array.from(groups.values()).map((g) => ({
        label: g.label,
        weight: Math.round((g.sum / g.count) * 10) / 10,
        count: g.count,
        date: g.date,
      }));
    } else if (timeframe === 'anios') {
      const groups = new Map<string, { label: string; sum: number; count: number; date: Date }>();
      for (const log of logs) {
        const { key, label, timestamp } = getYearKey(new Date(log.date));
        if (!groups.has(key)) {
          groups.set(key, { label, sum: 0, count: 0, date: new Date(timestamp) });
        }
        const grp = groups.get(key)!;
        grp.sum += log.weight;
        grp.count += 1;
      }
      chartData = Array.from(groups.values()).map((g) => ({
        label: g.label,
        weight: Math.round((g.sum / g.count) * 10) / 10,
        count: g.count,
        date: g.date,
      }));
    } else {
      // Default: 'sesiones'
      chartData = logs.map((l, index) => {
        const d = new Date(l.date);
        const dayStr = String(d.getDate()).padStart(2, '0');
        const monthStr = String(d.getMonth() + 1).padStart(2, '0');
        const hoursStr = String(d.getHours()).padStart(2, '0');
        const minStr = String(d.getMinutes()).padStart(2, '0');
        return {
          label: `#${index + 1} (${dayStr}/${monthStr} ${hoursStr}:${minStr})`,
          weight: l.weight,
          count: 1,
          date: d,
        };
      });
    }

    return NextResponse.json({
      data: chartData,
      rawLogs: logs.map((l) => ({
        id: l.id,
        weight: l.weight,
        date: l.date,
      })),
      summary: {
        current,
        avg,
        max,
        totalLogs: logs.length,
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Fetch Ejercicio Peso Progreso Error:', error);
    return NextResponse.json({ error: 'Error al obtener el progreso de peso' }, { status: 500 });
  }
}
