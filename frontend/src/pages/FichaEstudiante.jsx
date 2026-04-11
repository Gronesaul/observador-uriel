import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getFicha, updateAcudiente, marcarNotificado } from '../api'

const TIPO_BADGE = { tipo1: '🟡 Tipo I', tipo2: '🟠 Tipo II', tipo3: '🔴 Tipo III' }
const TIPO_CLASS = { tipo1: 'badge-tipo1', tipo2: 'badge-tipo2', tipo3: 'badge-tipo3' }

const PROTOCOLO_INFO = {
  llamado_atencion:   { titulo: '🟡 Llamado de Atención', bg: 'bg-yellow-50 border-yellow-300' },
  citacion_padres:    { titulo: '🟠 Citar al Acudiente', bg: 'bg-orange-50 border-orange-300' },
  comite_convivencia: { titulo: '🔴 Comité de Convivencia', bg: 'bg-red-50 border-red-300' },
  ruta_atencion:      { titulo: '🚨 Ruta de Atención Integral', bg: 'bg-red-100 border-red-400' },
  policia_infancia:   { titulo: '🚔 Policía de Infancia y Adolescencia', bg: 'bg-red-200 border-red-500' },
}

export default function FichaEstudiante() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [ficha, setFicha] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editAcudiente, setEditAcudiente] = useState(false)
  const [acudiente, setAcudiente] = useState({ nombre_acudiente: '', telefono_acudiente: '' })
  const [saving, setSaving] = useState(false)

  async function cargar() {
    try {
      const { data } = await getFicha(id)
      setFicha(data)
      setAcudiente({
        nombre_acudiente: data.estudiante.nombre_acudiente || '',
        telefono_acudiente: data.estudiante.telefono_acudiente || '',
      })
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { cargar() }, [id])

  async function guardarAcudiente() {
    setSaving(true)
    try {
      await updateAcudiente(id, acudiente)
      setEditAcudiente(false)
      cargar()
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  async function handleNotificado(anotId) {
    try {
      await marcarNotificado(anotId)
      cargar()
    } catch (e) { console.error(e) }
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Cargando ficha...</div>
  if (!ficha) return <div className="text-center text-red-500 py-12">Estudiante no encontrado.</div>

  const { estudiante, anotaciones, seguimientos, resumen } = ficha
  const protocolo = resumen.protocolo_actual

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-verde hover:underline text-sm">← Volver</button>
      </div>

      {/* Datos del estudiante */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-800">{estudiante.nombres} {estudiante.apellidos}</h1>
            <div className="text-sm text-gray-500 mt-1">Doc: {estudiante.documento} · {estudiante.grado} ({estudiante.grupo}) · Edad: {estudiante.edad}</div>
            <div className="text-xs text-gray-400 mt-0.5">{estudiante.sede}</div>
          </div>
          <button
            onClick={() => navigate(`/anotar/${id}`)}
            className="btn-primary self-start whitespace-nowrap"
          >
            ✏️ Nueva Anotación
          </button>
        </div>

        {/* Contadores */}
        <div className="flex gap-3 mt-4 flex-wrap">
          <span className="badge-tipo1 text-sm px-3 py-1">Tipo I: {resumen.tipo1}</span>
          <span className="badge-tipo2 text-sm px-3 py-1">Tipo II: {resumen.tipo2}</span>
          <span className="badge-tipo3 text-sm px-3 py-1">Tipo III: {resumen.tipo3}</span>
          <span className="bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-full">Total: {resumen.total}</span>
        </div>
      </div>

      {/* PROTOCOLO SUGERIDO */}
      {protocolo && (
        <div className={`border-2 rounded-xl p-4 ${PROTOCOLO_INFO[protocolo.codigo]?.bg || 'bg-gray-50 border-gray-200'}`}>
          <div className="font-bold text-base mb-1">
            {PROTOCOLO_INFO[protocolo.codigo]?.titulo || protocolo.titulo}
          </div>
          <p className="text-sm text-gray-700 mb-2">{protocolo.descripcion}</p>
          <div className="flex flex-wrap gap-3 text-xs text-gray-500">
            <span>👤 {protocolo.responsable}</span>
            <span>📖 {protocolo.base_legal}</span>
          </div>
        </div>
      )}

      {/* Acudiente */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-700">👨‍👩‍👧 Datos del Acudiente</h2>
          <button onClick={() => setEditAcudiente(!editAcudiente)} className="text-verde text-sm hover:underline">
            {editAcudiente ? 'Cancelar' : 'Editar'}
          </button>
        </div>

        {editAcudiente ? (
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Nombre del acudiente"
              value={acudiente.nombre_acudiente}
              onChange={e => setAcudiente({ ...acudiente, nombre_acudiente: e.target.value })}
              className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-verde focus:outline-none"
            />
            <input
              type="tel"
              placeholder="Teléfono WhatsApp (ej: 3001234567)"
              value={acudiente.telefono_acudiente}
              onChange={e => setAcudiente({ ...acudiente, telefono_acudiente: e.target.value })}
              className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-verde focus:outline-none"
            />
            <button onClick={guardarAcudiente} disabled={saving} className="btn-primary">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        ) : (
          <div className="text-sm">
            {estudiante.nombre_acudiente
              ? <><p className="text-gray-700">👤 {estudiante.nombre_acudiente}</p><p className="text-gray-500 mt-0.5">📱 {estudiante.telefono_acudiente || 'Sin teléfono'}</p></>
              : <p className="text-gray-400 italic">No registrado. Haz clic en Editar para agregar los datos.</p>
            }
          </div>
        )}

        {/* Botón WhatsApp */}
        {ficha.whatsapp_url && (
          <a
            href={ficha.whatsapp_url}
            target="_blank"
            rel="noreferrer"
            className="mt-4 flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors w-fit"
          >
            <span>💬</span> Notificar Acudiente por WhatsApp
          </a>
        )}
      </div>

      {/* Historial de anotaciones */}
      <div>
        <h2 className="font-bold text-gray-700 mb-3">📝 Historial de Anotaciones ({anotaciones.length})</h2>
        {anotaciones.length === 0 ? (
          <div className="card text-center text-gray-400 py-8">Sin anotaciones registradas.</div>
        ) : (
          <div className="space-y-3">
            {anotaciones.map(a => (
              <div key={a.id} className="card border-l-4 border-gray-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={TIPO_CLASS[a.tipo_falta]}>{TIPO_BADGE[a.tipo_falta]}</span>
                      {a.categoria && <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{a.categoria}</span>}
                    </div>
                    <p className="text-sm text-gray-700">{a.descripcion}</p>
                    {a.acciones_inmediatas && (
                      <p className="text-xs text-gray-500 mt-1">⚡ {a.acciones_inmediatas}</p>
                    )}
                    <div className="text-xs text-gray-400 mt-2">
                      {new Date(a.fecha_anotacion).toLocaleString('es-CO')} ·{' '}
                      {a.docente ? `${a.docente.nombres} ${a.docente.apellidos}` : 'Docente'} ·{' '}
                      {a.sede_origen}
                    </div>
                    {a.protocolo_sugerido && (
                      <div className="mt-2 text-xs font-semibold text-orange-700 bg-orange-50 border border-orange-200 px-2 py-1 rounded-lg inline-block">
                        ⚖️ {PROTOCOLO_INFO[a.protocolo_sugerido]?.titulo || a.protocolo_sugerido}
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    {a.notificado_acudiente ? (
                      <span className="text-xs text-green-600 font-semibold">✅ Notificado</span>
                    ) : (
                      <button
                        onClick={() => handleNotificado(a.id)}
                        className="text-xs text-orange-600 font-semibold hover:underline"
                      >
                        Marcar notificado
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Seguimientos */}
      {seguimientos.length > 0 && (
        <div>
          <h2 className="font-bold text-gray-700 mb-3">🛤️ Seguimientos</h2>
          <div className="space-y-2">
            {seguimientos.map(s => (
              <div key={s.id} className="card text-sm flex items-center justify-between">
                <div>
                  <div className="font-semibold">{PROTOCOLO_INFO[s.tipo_accion]?.titulo || s.tipo_accion}</div>
                  <div className="text-xs text-gray-400">{new Date(s.fecha_apertura).toLocaleDateString('es-CO')}</div>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  s.estado === 'completado' ? 'bg-green-100 text-green-700' :
                  s.estado === 'en_proceso' ? 'bg-blue-100 text-blue-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {s.estado}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
