import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getFicha, crearAnotacion } from '../api'

const CATEGORIAS_TIPO1 = [
  'Incumplimiento de deberes académicos',
  'Uso inadecuado del uniforme',
  'Impuntualidad o inasistencia injustificada',
  'Lenguaje irrespetuoso leve',
  'Desorden en clases',
  'Uso de celular sin autorización',
  'No portar agenda o materiales',
  'Otros (Tipo I)',
]

const CATEGORIAS_TIPO2 = [
  'Agresión verbal o psicológica',
  'Daño a bienes ajenos',
  'Fraude académico (copia, plagio)',
  'Reincidencia en faltas Tipo I',
  'Discriminación o burla',
  'Alteración de documentos',
  'Incitación a la indisciplina',
  'Consumo de sustancias en la institución',
  'Otros (Tipo II)',
]

const CATEGORIAS_TIPO3 = [
  'Agresión física grave',
  'Porte o uso de armas',
  'Acoso escolar (bullying) sostenido',
  'Abuso sexual o acoso de ese tipo',
  'Tráfico o consumo reiterado de SPA',
  'Actos delictivos dentro de la institución',
  'Intimidación o amenazas graves',
  'Otros (Tipo III)',
]

const TIPO_INFO = {
  tipo1: {
    label: '🟡 Tipo I — Leve',
    desc: 'Faltas que afectan el ambiente escolar pero se pueden resolver con diálogo y acciones pedagógicas.',
    color: 'border-yellow-400 bg-yellow-50',
    categorias: CATEGORIAS_TIPO1,
  },
  tipo2: {
    label: '🟠 Tipo II — Grave',
    desc: 'Faltas que afectan la convivencia escolar o la integridad de algún miembro de la comunidad.',
    color: 'border-orange-400 bg-orange-50',
    categorias: CATEGORIAS_TIPO2,
  },
  tipo3: {
    label: '🔴 Tipo III — Gravísima',
    desc: 'Faltas que atentan contra la dignidad humana, la integridad física o requieren intervención de autoridades.',
    color: 'border-red-500 bg-red-50',
    categorias: CATEGORIAS_TIPO3,
  },
}

export default function NuevaAnotacion() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [estudiante, setEstudiante] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [form, setForm] = useState({
    tipo_falta: '',
    categoria: '',
    descripcion: '',
    acciones_inmediatas: '',
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    getFicha(id)
      .then(({ data }) => setEstudiante(data.estudiante))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  function validar() {
    const e = {}
    if (!form.tipo_falta) e.tipo_falta = 'Selecciona el tipo de falta'
    if (!form.categoria) e.categoria = 'Selecciona la categoría'
    if (!form.descripcion.trim() || form.descripcion.trim().length < 10)
      e.descripcion = 'La descripción debe tener al menos 10 caracteres'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validar()) return
    setSending(true)
    try {
      const { data } = await crearAnotacion(id, form)
      setResultado(data)
    } catch (err) {
      console.error(err)
      setErrors({ general: err.response?.data?.detail || 'Error al guardar. Intenta de nuevo.' })
    } finally {
      setSending(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Cargando...</div>
  if (!estudiante) return <div className="text-center text-red-500 py-12">Estudiante no encontrado.</div>

  // ── RESULTADO (después de guardar) ──
  if (resultado) {
    const protocolo = resultado.protocolo_sugerido
    const PROTO_COLORS = {
      llamado_atencion:   'bg-yellow-50 border-yellow-400 text-yellow-800',
      citacion_padres:    'bg-orange-50 border-orange-400 text-orange-800',
      comite_convivencia: 'bg-red-50 border-red-400 text-red-800',
      ruta_atencion:      'bg-red-100 border-red-500 text-red-900',
      policia_infancia:   'bg-red-200 border-red-600 text-red-900',
    }
    const PROTO_LABELS = {
      llamado_atencion:   '🟡 Llamado de Atención',
      citacion_padres:    '🟠 Citar al Acudiente',
      comite_convivencia: '🔴 Comité de Convivencia',
      ruta_atencion:      '🚨 Ruta de Atención Integral',
      policia_infancia:   '🚔 Policía de Infancia y Adolescencia',
    }

    return (
      <div className="max-w-lg mx-auto space-y-5">
        <div className="bg-green-50 border-2 border-green-400 rounded-2xl p-6 text-center">
          <div className="text-4xl mb-2">✅</div>
          <h2 className="font-bold text-green-800 text-lg">Anotación registrada</h2>
          <p className="text-green-700 text-sm mt-1">
            {estudiante.nombres} {estudiante.apellidos} · {TIPO_INFO[form.tipo_falta]?.label}
          </p>
        </div>

        {protocolo && (
          <div className={`border-2 rounded-xl p-4 ${PROTO_COLORS[protocolo] || 'bg-gray-50 border-gray-300 text-gray-800'}`}>
            <div className="font-bold text-base mb-1">⚖️ Protocolo sugerido</div>
            <div className="font-semibold">{PROTO_LABELS[protocolo] || protocolo}</div>
            {resultado.protocolo_descripcion && (
              <p className="text-sm mt-1 opacity-80">{resultado.protocolo_descripcion}</p>
            )}
          </div>
        )}

        {resultado.whatsapp_url && (
          <div className="card">
            <p className="text-sm text-gray-600 mb-3">
              📱 Se sugiere notificar al acudiente. Haz clic para abrir WhatsApp con el mensaje listo.
            </p>
            <a
              href={resultado.whatsapp_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors w-fit"
            >
              💬 Notificar Acudiente por WhatsApp
            </a>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/estudiantes/${id}`)}
            className="btn-primary flex-1"
          >
            Ver ficha del estudiante
          </button>
          <button
            onClick={() => navigate('/estudiantes')}
            className="flex-1 border-2 border-gray-200 text-gray-600 font-semibold py-2 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Volver a estudiantes
          </button>
        </div>
      </div>
    )
  }

  const tipoActual = TIPO_INFO[form.tipo_falta]

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-verde hover:underline text-sm">← Volver</button>
      </div>

      <div className="card">
        <h1 className="text-lg font-bold text-gray-800 mb-0.5">✏️ Nueva Anotación</h1>
        <p className="text-sm text-gray-500">
          {estudiante.nombres} {estudiante.apellidos} · {estudiante.grado} ({estudiante.grupo}) · {estudiante.sede}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Tipo de falta */}
        <div className="card space-y-3">
          <label className="block font-semibold text-gray-700 text-sm">Tipo de Falta *</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {Object.entries(TIPO_INFO).map(([key, info]) => (
              <button
                key={key}
                type="button"
                onClick={() => setForm({ ...form, tipo_falta: key, categoria: '' })}
                className={`text-left p-3 rounded-xl border-2 transition-all ${
                  form.tipo_falta === key
                    ? info.color + ' border-opacity-100'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold text-sm">{info.label}</div>
                <div className="text-xs text-gray-500 mt-1 leading-snug">{info.desc}</div>
              </button>
            ))}
          </div>
          {errors.tipo_falta && <p className="text-red-500 text-xs">{errors.tipo_falta}</p>}
        </div>

        {/* Categoría */}
        {tipoActual && (
          <div className="card">
            <label className="block font-semibold text-gray-700 text-sm mb-2">Categoría *</label>
            <select
              value={form.categoria}
              onChange={e => setForm({ ...form, categoria: e.target.value })}
              className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-verde focus:outline-none"
            >
              <option value="">— Selecciona la categoría —</option>
              {tipoActual.categorias.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.categoria && <p className="text-red-500 text-xs mt-1">{errors.categoria}</p>}
          </div>
        )}

        {/* Descripción */}
        <div className="card">
          <label className="block font-semibold text-gray-700 text-sm mb-2">
            Descripción de los hechos *
          </label>
          <textarea
            rows={4}
            placeholder="Describe los hechos de manera objetiva: qué pasó, dónde, cuándo y quiénes estuvieron involucrados..."
            value={form.descripcion}
            onChange={e => setForm({ ...form, descripcion: e.target.value })}
            className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-verde focus:outline-none resize-none"
          />
          <div className="flex items-center justify-between mt-1">
            {errors.descripcion
              ? <p className="text-red-500 text-xs">{errors.descripcion}</p>
              : <span className="text-xs text-gray-400">Mínimo 10 caracteres</span>
            }
            <span className="text-xs text-gray-400">{form.descripcion.length} caracteres</span>
          </div>
        </div>

        {/* Acciones inmediatas */}
        <div className="card">
          <label className="block font-semibold text-gray-700 text-sm mb-1">
            Acciones inmediatas tomadas <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <p className="text-xs text-gray-400 mb-2">
            Ej: Diálogo con el estudiante, llamado de atención verbal, separado del grupo temporalmente...
          </p>
          <textarea
            rows={2}
            placeholder="¿Qué acción tomaste en el momento?"
            value={form.acciones_inmediatas}
            onChange={e => setForm({ ...form, acciones_inmediatas: e.target.value })}
            className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-verde focus:outline-none resize-none"
          />
        </div>

        {errors.general && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
            {errors.general}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={sending}
            className="btn-primary flex-1 py-3 text-base"
          >
            {sending ? '⏳ Guardando...' : '💾 Guardar Anotación'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="border-2 border-gray-200 text-gray-600 font-semibold px-6 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
