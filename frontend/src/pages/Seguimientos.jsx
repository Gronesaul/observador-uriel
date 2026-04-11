import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSeguimientosPendientes, updateSeguimiento } from '../api'

const PROTOCOLO_LABELS = {
  llamado_atencion:   '🟡 Llamado de Atención',
  citacion_padres:    '🟠 Citar al Acudiente',
  comite_convivencia: '🔴 Comité de Convivencia',
  ruta_atencion:      '🚨 Ruta de Atención Integral',
  policia_infancia:   '🚔 Policía de Infancia',
}

const PROTOCOLO_COLORS = {
  llamado_atencion:   'border-yellow-300 bg-yellow-50',
  citacion_padres:    'border-orange-300 bg-orange-50',
  comite_convivencia: 'border-red-300 bg-red-50',
  ruta_atencion:      'border-red-400 bg-red-100',
  policia_infancia:   'border-red-500 bg-red-200',
}

const ESTADO_COLORS = {
  pendiente:   'bg-yellow-100 text-yellow-700',
  en_proceso:  'bg-blue-100 text-blue-700',
  completado:  'bg-green-100 text-green-700',
}

const ESTADO_LABELS = {
  pendiente:  'Pendiente',
  en_proceso: 'En proceso',
  completado: 'Completado',
}

export default function Seguimientos() {
  const navigate = useNavigate()
  const [seguimientos, setSeguimientos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('pendiente')
  const [expandido, setExpandido] = useState(null)
  const [editando, setEditando] = useState(null)
  const [editForm, setEditForm] = useState({ estado: '', observaciones: '', compromisos: '' })
  const [saving, setSaving] = useState(false)

  async function cargar() {
    setLoading(true)
    try {
      const { data } = await getSeguimientosPendientes()
      setSeguimientos(data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { cargar() }, [])

  const filtrados = filtroEstado === 'todos'
    ? seguimientos
    : seguimientos.filter(s => s.estado === filtroEstado)

  function abrirEditar(s) {
    setEditando(s.id)
    setEditForm({ estado: s.estado, observaciones: s.observaciones || '', compromisos: s.compromisos || '' })
    setExpandido(s.id)
  }

  async function guardarEdicion(id) {
    setSaving(true)
    try {
      await updateSeguimiento(id, editForm)
      setEditando(null)
      cargar()
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  const conteos = {
    pendiente:  seguimientos.filter(s => s.estado === 'pendiente').length,
    en_proceso: seguimientos.filter(s => s.estado === 'en_proceso').length,
    completado: seguimientos.filter(s => s.estado === 'completado').length,
  }

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">📋 Seguimientos</h1>
        <span className="text-sm text-gray-400">{filtrados.length} registros</span>
      </div>

      {/* Contadores rápidos */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { key: 'pendiente',  label: 'Pendientes',  icon: '⏳', color: 'border-yellow-400' },
          { key: 'en_proceso', label: 'En Proceso',  icon: '🔄', color: 'border-blue-400' },
          { key: 'completado', label: 'Completados', icon: '✅', color: 'border-green-400' },
        ].map(({ key, label, icon, color }) => (
          <button
            key={key}
            onClick={() => setFiltroEstado(key)}
            className={`card border-l-4 ${color} text-left transition-shadow ${filtroEstado === key ? 'shadow-md ring-2 ring-verde/30' : 'hover:shadow-md'}`}
          >
            <div className="text-2xl font-bold text-gray-700">{conteos[key]}</div>
            <div className="text-xs text-gray-500 mt-0.5">{icon} {label}</div>
          </button>
        ))}
      </div>

      {/* Filtro */}
      <div className="flex gap-2 flex-wrap">
        {['pendiente', 'en_proceso', 'completado', 'todos'].map(e => (
          <button
            key={e}
            onClick={() => setFiltroEstado(e)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
              filtroEstado === e
                ? 'bg-verde text-white border-verde'
                : 'border-gray-200 text-gray-500 hover:border-verde hover:text-verde'
            }`}
          >
            {e === 'todos' ? 'Todos' : ESTADO_LABELS[e]}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="text-center text-gray-400 py-12">Cargando seguimientos...</div>
      ) : filtrados.length === 0 ? (
        <div className="card text-center text-gray-400 py-12">
          {filtroEstado === 'pendiente' ? '🎉 No hay seguimientos pendientes.' : 'Sin registros con este filtro.'}
        </div>
      ) : (
        <div className="space-y-3">
          {filtrados.map(s => (
            <div
              key={s.id}
              className={`border-2 rounded-xl overflow-hidden transition-shadow hover:shadow-md ${PROTOCOLO_COLORS[s.tipo_accion] || 'border-gray-200 bg-white'}`}
            >
              {/* Cabecera del seguimiento */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer"
                onClick={() => setExpandido(expandido === s.id ? null : s.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-gray-800 truncate">{s.estudiante}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{s.sede} · {s.grado}</div>
                  <div className="text-xs font-semibold mt-1">{PROTOCOLO_LABELS[s.tipo_accion] || s.tipo_accion}</div>
                </div>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ESTADO_COLORS[s.estado]}`}>
                    {ESTADO_LABELS[s.estado]}
                  </span>
                  <button
                    onClick={e => { e.stopPropagation(); navigate(`/estudiantes/${s.estudiante_id}`) }}
                    className="text-xs text-verde hover:underline font-semibold"
                  >
                    Ver ficha
                  </button>
                  <span className="text-gray-400 text-xs">{expandido === s.id ? '▲' : '▼'}</span>
                </div>
              </div>

              {/* Detalle expandido */}
              {expandido === s.id && (
                <div className="border-t border-black/5 p-4 bg-white/70 space-y-3">
                  <div className="text-xs text-gray-400">
                    Apertura: {new Date(s.fecha_apertura).toLocaleDateString('es-CO')}
                    {s.fecha_cierre && ` · Cierre: ${new Date(s.fecha_cierre).toLocaleDateString('es-CO')}`}
                  </div>

                  {editando === s.id ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-600 mb-1 block">Estado</label>
                        <select
                          value={editForm.estado}
                          onChange={e => setEditForm({ ...editForm, estado: e.target.value })}
                          className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-verde focus:outline-none"
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="en_proceso">En proceso</option>
                          <option value="completado">Completado</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 mb-1 block">Observaciones</label>
                        <textarea
                          rows={2}
                          placeholder="Qué acciones se han tomado..."
                          value={editForm.observaciones}
                          onChange={e => setEditForm({ ...editForm, observaciones: e.target.value })}
                          className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-verde focus:outline-none resize-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 mb-1 block">Compromisos</label>
                        <textarea
                          rows={2}
                          placeholder="Compromisos asumidos por el estudiante o acudiente..."
                          value={editForm.compromisos}
                          onChange={e => setEditForm({ ...editForm, compromisos: e.target.value })}
                          className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-verde focus:outline-none resize-none"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => guardarEdicion(s.id)}
                          disabled={saving}
                          className="btn-primary text-sm"
                        >
                          {saving ? 'Guardando...' : 'Guardar cambios'}
                        </button>
                        <button
                          onClick={() => setEditando(null)}
                          className="text-sm text-gray-500 hover:underline"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {s.observaciones && (
                        <div>
                          <div className="text-xs font-semibold text-gray-500">Observaciones:</div>
                          <p className="text-sm text-gray-700">{s.observaciones}</p>
                        </div>
                      )}
                      {s.compromisos && (
                        <div>
                          <div className="text-xs font-semibold text-gray-500">Compromisos:</div>
                          <p className="text-sm text-gray-700">{s.compromisos}</p>
                        </div>
                      )}
                      {!s.observaciones && !s.compromisos && (
                        <p className="text-xs text-gray-400 italic">Sin observaciones registradas.</p>
                      )}
                      <button
                        onClick={() => abrirEditar(s)}
                        className="text-sm text-verde font-semibold hover:underline mt-1"
                      >
                        ✏️ Actualizar seguimiento
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
