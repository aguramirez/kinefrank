"use client";

import { useState, useEffect, useCallback } from "react";
import Logo from "@/components/Logo";

interface NotaClinica {
  id: string;
  title: string;
  description: string;
  photoUrl: string | null;
  createdAt: string;
}

export default function HistoriaClinicaTab({ alumnoId }: { alumnoId: string }) {
  const [notas, setNotas] = useState<NotaClinica[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [selectedNota, setSelectedNota] = useState<NotaClinica | null>(null);

  const fetchNotas = useCallback(async () => {
    if (!alumnoId) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/alumnos/${alumnoId}/notas`);
      if (res.ok) {
        setNotas(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [alumnoId]);

  useEffect(() => {
    fetchNotas();
  }, [fetchNotas]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      setError("La imagen es demasiado pesada (máx 20MB).");
      return;
    }

    setUploadingImage(true);
    setError("");

    try {
      const sigRes = await fetch("/api/cloudinary-sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: "kineapp_notas" }),
      });

      if (!sigRes.ok) throw new Error("Error obteniendo la firma");

      const { timestamp, signature, cloudName, apiKey } = await sigRes.json();

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", timestamp.toString());
      formData.append("signature", signature);
      formData.append("folder", "kineapp_notas");

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: formData }
      );

      if (!uploadRes.ok) throw new Error("Error subiendo a Cloudinary");

      const uploadData = await uploadRes.json();
      setPhotoUrl(uploadData.secure_url);
    } catch (err) {
      console.error(err);
      setError("Hubo un error al subir la imagen.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !description.trim()) {
      setError("Título y descripción son obligatorios.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/alumnos/${alumnoId}/notas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          photoUrl: photoUrl.trim() || null,
        }),
      });

      if (!res.ok) throw new Error("Error al guardar la nota");

      setFormOpen(false);
      setTitle("");
      setDescription("");
      setPhotoUrl("");
      fetchNotas();
    } catch (err) {
      console.error(err);
      setError("Error al crear la nota.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta nota?")) return;
    try {
      const res = await fetch(`/api/alumnos/${alumnoId}/notas/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchNotas();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!alumnoId) {
    return (
      <div className="flex flex-col items-center justify-center py-10 bg-slate-50 dark:bg-white/[0.03] rounded-xl border border-slate-200 dark:border-slate-800">
        <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 mb-3">save</span>
        <p className="text-sm text-slate-500 font-medium text-center px-4">Debes guardar el alumno primero para poder agregar notas a su historia clínica.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Logo animate className="w-8 h-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-4 animate-[fadeIn_0.3s_ease-out]">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white">Historia Clínica</h4>
        {!formOpen && (
          <button
            onClick={() => setFormOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-bold hover:bg-primary/20 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Nueva Nota
          </button>
        )}
      </div>

      {selectedNota ? (
        <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => setSelectedNota(null)} className="p-2 bg-slate-100 dark:bg-white/5 text-slate-500 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 transition-colors flex items-center justify-center">
              <span className="material-symbols-outlined text-sm">arrow_back</span>
            </button>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{selectedNota.title}</h4>
              <p className="text-[10px] text-slate-500">{new Date(selectedNota.createdAt).toLocaleDateString("es-AR", { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            </div>
            <button onClick={() => { handleDelete(selectedNota.id); setSelectedNota(null); }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Eliminar">
              <span className="material-symbols-outlined text-sm">delete</span>
            </button>
          </div>
          <div className="bg-slate-50 dark:bg-white/[0.03] p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <h5 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Descripción</h5>
            <div className="max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words">{selectedNota.description}</p>
            </div>
            {selectedNota.photoUrl && (
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <h5 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Foto adjunta</h5>
                <img src={selectedNota.photoUrl} alt={selectedNota.title} className="rounded-xl w-full max-h-96 object-contain border border-slate-200 dark:border-slate-700 bg-black/5 dark:bg-white/5" />
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {formOpen && (
            <div className="bg-slate-50 dark:bg-white/[0.03] p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
              {error && <p className="text-xs text-red-500 font-bold bg-red-500/10 p-2 rounded-lg">{error}</p>}
              
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Título</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Motivo de consulta, evolución, etc."
                  className="w-full px-3 py-2 bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/40 outline-none dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Descripción</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Detalle de la nota..."
                  className="w-full px-3 py-2 bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/40 outline-none dark:text-white resize-y"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Foto (opcional)</label>
                {photoUrl ? (
                  <div className="relative inline-block border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden group">
                    <img src={photoUrl} alt="Nota" className="h-32 object-cover" />
                    <button
                      onClick={() => setPhotoUrl("")}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <span className="material-symbols-outlined text-[14px]">delete</span>
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 transition-all">
                    {uploadingImage ? (
                      <div className="flex flex-col items-center text-primary">
                        <Logo animate className="w-5 h-5 text-current mb-1" />
                        <span className="text-[10px] font-bold">Subiendo...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-slate-400">
                        <span className="material-symbols-outlined text-2xl mb-1">image</span>
                        <span className="text-xs font-medium">Click para agregar foto</span>
                      </div>
                    )}
                    <input type="file" className="hidden" accept="image/*" disabled={uploadingImage} onChange={handleImageUpload} />
                  </label>
                )}
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  onClick={() => { setFormOpen(false); setError(""); }}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 text-xs font-bold bg-primary text-white rounded-lg hover:bg-primary/90 transition-all flex items-center gap-2"
                >
                  {saving ? <Logo animate className="w-4 h-4 text-current" /> : "Guardar Nota"}
                </button>
              </div>
            </div>
          )}

          {notas.length === 0 ? (
            !formOpen && <p className="text-sm text-slate-500 text-center py-8">No hay notas en la historia clínica.</p>
          ) : (
            <div className="space-y-3">
              {notas.map((nota) => (
                <div key={nota.id} className="flex items-center justify-between p-3 bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-800 rounded-xl hover:border-primary/50 transition-colors group">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      <span className="material-symbols-outlined text-lg">edit_document</span>
                    </div>
                    <div className="min-w-0 pr-4">
                      <h5 className="font-bold text-slate-900 dark:text-white text-sm truncate">{nota.title}</h5>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                          {new Date(nota.createdAt).toLocaleDateString("es-AR")}
                        </p>
                        {nota.photoUrl && (
                          <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                            <span className="material-symbols-outlined text-[12px]">image</span>
                            Foto
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => setSelectedNota(nota)} className="px-3 py-2 bg-primary/10 text-primary rounded-lg text-xs font-bold hover:bg-primary/20 transition-colors flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">visibility</span>
                      <span className="hidden sm:inline">Ver detalle</span>
                    </button>
                    <button onClick={() => handleDelete(nota.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Eliminar">
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
