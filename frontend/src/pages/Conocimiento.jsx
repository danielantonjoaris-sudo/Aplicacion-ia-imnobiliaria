import React, { useEffect, useState } from "react";
import { Layout } from "../components/Layout";
import { Modal } from "../components/Modal";
import { api } from "../lib/api";
import { Plus, Pencil } from "lucide-react";

const TEMAS = ["cliente_ideal", "oferta", "anuncios", "landing"];
const TIPOS = ["clase", "ponencia", "qa", "documento"];
const TIPOS_CAMPANA = ["captacion", "venta", "ambas"];

const VACIO = { fuente: "Método InmoMatic", tipo: "clase", titulo: "", contenido: "", temas: [], tipo_campana: "captacion" };

export default function Conocimiento() {
  const [items, setItems] = useState([]);
  const [abierto, setAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(VACIO);
  const [guardando, setGuardando] = useState(false);

  const cargar = () => api.get("/conocimiento").then((r) => setItems(r.data));
  useEffect(() => { cargar(); }, []);

  const abrirNuevo = () => { setEditando(null); setForm(VACIO); setAbierto(true); };
  const abrirEditar = (it) => {
    setEditando(it.id);
    setForm({ fuente: it.fuente, tipo: it.tipo, titulo: it.titulo, contenido: it.contenido, temas: it.temas || [], tipo_campana: it.tipo_campana });
    setAbierto(true);
  };

  const toggleTema = (t) =>
    setForm((f) => ({ ...f, temas: f.temas.includes(t) ? f.temas.filter((x) => x !== t) : [...f.temas, t] }));

  const valido = form.titulo.trim() && form.contenido.trim() && form.temas.length > 0;

  const guardar = async () => {
    if (!valido || guardando) return;
    setGuardando(true);
    try {
      if (editando) await api.put(`/conocimiento/${editando}`, form);
      else await api.post("/conocimiento", form);
      await cargar();
      setAbierto(false);
    } finally {
      setGuardando(false);
    }
  };

  const inputCls = "w-full rounded-[8px] border px-4 py-2.5 text-[16px] outline-none focus:border-[#0B4DA8]";

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="antetitulo mb-2">ADMINISTRACIÓN</div>
          <h1 className="font-sora font-extrabold text-[40px] leading-tight">Base de conocimiento</h1>
        </div>
        <button
          onClick={abrirNuevo}
          data-testid="conocimiento-nuevo"
          className="inline-flex items-center gap-2 text-white font-semibold px-5 py-3 rounded-[8px]"
          style={{ background: "var(--azul)" }}
        >
          <Plus size={18} /> Añadir fragmento
        </button>
      </div>

      <div className="space-y-3" data-testid="lista-conocimiento">
        {items.map((it) => (
          <div
            key={it.id}
            className="rounded-[12px] border px-6 py-5 bg-white"
            style={{ borderColor: "var(--borde)" }}
            data-testid={`conocimiento-item-${it.id}`}
          >
            <div className="flex items-start justify-between">
              <div className="pr-6">
                <div className="font-sora font-semibold text-[18px] mb-1">{it.titulo}</div>
                <p className="text-[15px] line-clamp-2" style={{ color: "var(--texto-2)" }}>{it.contenido}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {it.temas.map((t) => (
                    <span key={t} className="text-[12px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "var(--acento)", color: "var(--azul)" }}>{t}</span>
                  ))}
                  <span className="text-[12px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "var(--suave)", color: "var(--texto-2)" }}>{it.tipo}</span>
                  <span className="text-[12px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "var(--suave)", color: "var(--texto-2)" }}>{it.tipo_campana}</span>
                </div>
              </div>
              <button
                onClick={() => abrirEditar(it)}
                data-testid={`editar-conocimiento-${it.id}`}
                className="inline-flex items-center gap-1.5 text-[14px] font-semibold px-3 py-2 rounded-[8px] border shrink-0"
                style={{ borderColor: "var(--borde)", color: "var(--azul)" }}
              >
                <Pencil size={15} /> Editar
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal abierto={abierto} onClose={() => setAbierto(false)} titulo={editando ? "Editar fragmento" : "Nuevo fragmento"} testid="modal-conocimiento">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-[15px] mb-1">Fuente</label>
              <input data-testid="cn-fuente" className={inputCls} style={{ borderColor: "var(--borde-campo)" }} value={form.fuente} onChange={(e) => setForm({ ...form, fuente: e.target.value })} />
            </div>
            <div>
              <label className="block font-semibold text-[15px] mb-1">Tipo</label>
              <select data-testid="cn-tipo" className={inputCls} style={{ borderColor: "var(--borde-campo)" }} value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block font-semibold text-[15px] mb-1">Título</label>
            <input data-testid="cn-titulo" className={inputCls} style={{ borderColor: "var(--borde-campo)" }} value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Clase 8 — ..." />
          </div>
          <div>
            <label className="block font-semibold text-[15px] mb-1">Contenido</label>
            <textarea data-testid="cn-contenido" rows={7} className={inputCls} style={{ borderColor: "var(--borde-campo)" }} value={form.contenido} onChange={(e) => setForm({ ...form, contenido: e.target.value })} />
          </div>
          <div>
            <label className="block font-semibold text-[15px] mb-2">Temas</label>
            <div className="flex flex-wrap gap-2">
              {TEMAS.map((t) => {
                const activo = form.temas.includes(t);
                return (
                  <button key={t} data-testid={`cn-tema-${t}`} onClick={() => toggleTema(t)} className="rounded-full border px-4 py-2 text-[14px] font-medium" style={{ borderColor: activo ? "var(--azul)" : "var(--borde-campo)", background: activo ? "var(--acento)" : "white", color: activo ? "var(--azul)" : "var(--texto)" }}>{t}</button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="block font-semibold text-[15px] mb-1">Tipo de campaña</label>
            <select data-testid="cn-tipo-campana" className={inputCls} style={{ borderColor: "var(--borde-campo)" }} value={form.tipo_campana} onChange={(e) => setForm({ ...form, tipo_campana: e.target.value })}>
              {TIPOS_CAMPANA.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <button onClick={guardar} disabled={!valido || guardando} data-testid="cn-guardar" className="w-full text-white font-semibold py-3.5 rounded-[8px] disabled:opacity-40" style={{ background: "var(--azul)" }}>
            {guardando ? "Guardando..." : "Guardar fragmento"}
          </button>
        </div>
      </Modal>
    </Layout>
  );
}
