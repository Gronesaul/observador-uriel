import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getFicha, crearAnotacion } from '../api'

// ── DATOS DE CADA TRACK ────────────────────────────────────────────────

const SITUACIONES = {
  tipo1: {
    label: 'Situación Tipo I',
    badge: '🟡 Tipo I — Leve',
    desc: 'Conflicto puntual entre estudiantes que puede resolverse con diálogo y mediación. No hay agresión sostenida.',
    color: 'border-yellow-400 bg-yellow-50',
    badgeColor: 'bg-yellow-100 text-yellow-700',
    categorias: [
      'Conflicto verbal leve entre estudiantes',
      'Irrespeto verbal esporádico a un compañero',
      'Exclusión o burla puntual',
      'Desacuerdo que altera el ambiente de aula',
      'Lenguaje ofensivo leve y aislado',
      'Otro conflicto Tipo I',
    ],
  },
  tipo2: {
    label: 'Situación Tipo II',
    badge: '🟠 Tipo II — Grave',
    desc: 'Agresión, acoso o conducta que afecta la integridad de alguien. Puede requerir intervención de coordinación.',
    color: 'border-orange-400 bg-orange-50',
    badgeColor: 'bg-orange-100 text-orange-700',
    categorias: [
      'Agresión verbal sostenida o intimidación',
      'Agresión física (golpes, empujones sin lesión grave)',
      'Daño intencional a bienes de un compañero',
      'Acoso entre pares en inicio (patrón de hostigamiento)',
      'Discriminación o trato degradante reiterado',
      'Grabación o difusión sin consentimiento',
      'Hurto comprobado dentro de la institución',
      'Inasistencias injustificadas reiteradas (más de 5 días)',
      'Reincidencia en situaciones Tipo I sin mejoría',
      'Otra situación Tipo II',
    ],
  },
  tipo3: {
    label: 'Situación Tipo III',
    badge: '🔴 Tipo III — Gravísima',
    desc: 'Situación que constituye presunto delito o vulnera gravemente derechos fundamentales. Requiere autoridades.',
    color: 'border-red-500 bg-red-50',
    badgeColor: 'bg-red-100 text-red-700',
    categorias: [
      'Agresión física grave con lesiones',
      'Porte o uso de armas',
      'Consumo o tráfico de sustancias psicoactivas',
      'Abuso sexual o violencia de género',
      'Acoso escolar sistemático (bullying documentado)',
      'Ciberacoso o difusión de contenido íntimo',
      'Amenaza grave o extorsión',
      'Delito contra la propiedad (hurto mayor)',
      'Vulneración grave de derechos fundamentales',
      'Otra situación Tipo III (presunto delito)',
    ],
  },
}

const FALTAS = {
  leve: {
    label: 'Falta Leve',
    badge: '🟡 Falta Leve',
    desc: 'Incumplimiento puntual de las normas del Manual. Primera o segunda vez. No afecta la integridad de nadie.',
    color: 'border-yellow-300 bg-yellow-50',
    badgeColor: 'bg-yellow-100 text-yellow-700',
    categorias: [
      'Uso inadecuado del uniforme',
      'Impuntualidad (llegada tarde)',
      'No traer materiales o agenda',
      'Uso de celular sin autorización',
      'Desorden o indisciplina en clase',
      'Lenguaje inadecuado leve y aislado',
      'Incumplimiento de tareas o compromisos académicos',
      'Juegos bruscos en descanso (sin lesión)',
      'Salir del salón sin permiso',
      'Otra falta leve al Manual',
    ],
  },
  grave: {
    label: 'Falta Grave',
    badge: '🟠 Falta Grave',
    desc: 'Incumplimiento serio del Manual o reincidencia reiterada en faltas leves. Requiere intervención de coordinación.',
    color: 'border-orange-400 bg-orange-50',
    badgeColor: 'bg-orange-100 text-orange-700',
    categorias: [
      'Irrespeto verbal a un docente o directivo',
      'Daño o deterioro de bienes institucionales',
      'Fraude académico (copia en evaluación, plagio)',
      'Reincidencia reiterada en faltas leves sin mejoría',
      'Falsificación de firma o documentos',
      'Salir de la institución sin autorización',
      'Incitar a otros estudiantes a la indisciplina',
      'Consumo de cigarrillo o alcohol en la institución',
      'Otra falta grave al Manual',
    ],
  },
  gravisima: {
    label: 'Falta Gravísima',
    badge: '🔴 Falta Gravísima',
    desc: 'Infracción muy grave al Manual. Puede implicar matrícula condicional o proceso disciplinario formal.',
    color: 'border-red-500 bg-red-50',
    badgeColor: 'bg-red-100 text-red-700',
    categorias: [
      'Irrespeto grave o agresión a un docente / directivo',
      'Destrucción intencional de bienes institucionales',
      'Reincidencia en faltas graves sin ninguna mejoría',
      'Tráfico o distribución de sustancias dentro del colegio',
      'Amenaza a miembros de la comunidad educativa',
      'Actos que atenten contra la moral e imagen del colegio',
      'Otra falta gravísima al Manual',
    ],
  },
}

const PROTO_LABELS = {
  llamado_atencion:     '🟡 Llamado de Atención',
  citacion_padres:      '🟠 Citación al Acudiente',
  comite_convivencia:   '🔴 Comité de Convivencia',
  ruta_atencion:        '🚨 Ruta de Atención Integral',
  policia_infancia:     '🚔 Policía de Infancia y Adolescencia',
  amonestacion_verbal:  '🟡 Amonestación Verbal con Registro',
  citacion_falta:       '🟠 Citación al Acudiente por Falta',
  proceso_disciplinario:'🔴 Proceso Disciplinario Interno',
  suspension_comite:    '🚨 Comité + Posible Matrícula Condicional',
}

const PROTO_COLORS = {
  llamado_atencion:     'bg-yellow-50 border-yellow-400 text-yellow-800',
  citacion_padres:      'bg-orange-50 border-orange-400 text-orange-800',
  comite_convivencia:   'bg-red-50 border-red-400 text-red-800',
  ruta_atencion:        'bg-red-100 border-red-500 text-red-900',
  policia_infancia:     'bg-red-200 border-red-600 text-red-900',
  amonestacion_verbal:  'bg-yellow-50 border-yellow-300 text-yellow-800',
  citacion_falta:       'bg-orange-50 border-orange-300 text-orange-800',
  proceso_disciplinario:'bg-red-50 border-red-300 text-red-800',
  suspension_comite:    'bg-red-100 border-red-500 text-red-900',
}

// ── COMPONENTE ─────────────────────────────────────────────────────────

export default function NuevaAnotacion() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [estudiante, setEstudiante] = useState(null)
  const [loading, setLoading]       = useState(true)
  const [sending, setSending]       = useState(false)
  const [resultado, setResultado]   = useState(null)

  const [tipoRegistro, setTipoRegistro] = useState('')   // "situacion" | "falta"
  const [tipoFalta, setTipoFalta]       = useState('')   // tipo1/tipo2/tipo3 | leve/grave/gravisima
  const [categoria, setCategoria]       = useState('')
  const [descripcion, setDescripcion]   = useState('')
  const [acciones, setAcciones]         = useState('')
  const [errors, setErrors]             = useState({})

  useEffect(() => {
    getFicha(id)
      .then(({ data }) => setEstudiante(data.estudiante))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  function resetTipo() { setTipoFalta(''); setCategoria('') }

  function validar() {
    const e = {}
    if (!tipoRegistro) e.tipoRegistro = 'Selecciona si es situación o falta'
    if (!tipoFalta)    e.tipoFalta    = 'Selecciona la clasificación'
    if (!categoria)    e.categoria    = 'Selecciona la categoría'
    if (!descripcion.trim() || descripcion.trim().length < 10)
      e.descripcion = 'La descripción debe tener al menos 10 caracteres'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validar()) return
    setSending(true)
    try {
      const { data } = await crearAnotacion({
        estudiante_id: parseInt(id),
        tipo_registro: tipoRegistro,
        tipo_falta: tipoFalta,
        categoria,
        descripcion,
        acciones_inmediatas: acciones,
      })
      setResultado(data)
    } catch (err) {
      console.error(err)
      const detail = err.response?.data?.detail
      const msg = Array.isArray(detail)
        ? detail.map(d => d.msg || JSON.stringify(d)).join(' | ')
        : (typeof detail === 'string' ? detail : 'Error al guardar. Intenta de nuevo.')
      setErrors({ general: msg })
    } finally {
      setSending(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Cargando...</div>
  if (!estudiante) return <div className="text-center text-red-500 py-12">Estudiante no encontrado.</div>

  // ── RESULTADO ──────────────────────────────────────────────────────
  if (resultado) {
    const proto = resultado.protocolo_sugerido
    return (
      <div className="max-w-lg mx-auto space-y-5">
        <div className="bg-green-50 border-2 border-green-400 rounded-2xl p-6 text-center">
          <div className="text-4xl mb-2">✅</div>
          <h2 className="font-bold text-green-800 text-lg">Registro guardado</h2>
          <p className="text-green-700 text-sm mt-1">
            {estudiante.nombres} {estudiante.apellidos}
            {tipoRegistro === 'falta'
              ? ` · ${FALTAS[tipoFalta]?.badge}`
              : ` · ${SITUACIONES[tipoFalta]?.badge}`}
          </p>
        </div>

        {proto && (
          <div className={`border-2 rounded-xl p-4 ${PROTO_COLORS[proto] || 'bg-gray-50 border-gray-300 text-gray-800'}`}>
            <div className="font-bold text-sm mb-1">⚖️ Protocolo sugerido</div>
            <div className="font-semibold">{PROTO_LABELS[proto] || proto}</div>
            {resultado.protocolo_descripcion && (
              <p className="text-xs mt-1 opacity-80 leading-snug">{resultado.protocolo_descripcion}</p>
            )}
          </div>
        )}

        {resultado.whatsapp_url && (
          <div className="card">
            <p className="text-sm text-gray-600 mb-3">
              📱 Notifica al acudiente. WhatsApp se abre con el mensaje listo.
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
          <button onClick={() => navigate(`/estudiantes/${id}`)} className="btn-primary flex-1">
            Ver ficha del estudiante
          </button>
          <button
            onClick={() => navigate('/estudiantes')}
            className="flex-1 border-2 border-gray-200 text-gray-600 font-semibold py-2 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    )
  }

  const trackData = tipoRegistro === 'situacion' ? SITUACIONES : tipoRegistro === 'falta' ? FALTAS : null
  const claseActual = trackData ? trackData[tipoFalta] : null

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-verde hover:underline text-sm">← Volver</button>
      </div>

      <div className="card">
        <h1 className="text-lg font-bold text-gray-800 mb-0.5">✏️ Nuevo Registro</h1>
        <p className="text-sm text-gray-500">
          {estudiante.nombres} {estudiante.apellidos} · {estudiante.grado} ({estudiante.grupo}) · {estudiante.sede}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* PASO 1 — ¿Qué vas a registrar? */}
        <div className="card space-y-3">
          <div>
            <label className="block font-bold text-gray-700 mb-1">¿Qué vas a registrar? *</label>
            <p className="text-xs text-gray-400 mb-3">
              <strong>Situación:</strong> conflicto de convivencia entre personas (Decreto 1965/2013) ·
              <strong> Falta:</strong> incumplimiento de normas internas del Manual
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => { setTipoRegistro('situacion'); resetTipo() }}
              className={`text-left p-4 rounded-xl border-2 transition-all ${
                tipoRegistro === 'situacion'
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-bold text-sm">🤝 Situación de Convivencia</div>
              <div className="text-xs text-gray-500 mt-1 leading-snug">
                Conflicto, agresión o hecho que afecta la convivencia escolar.
                Clasificación Tipo I, II o III según Decreto 1965/2013.
              </div>
            </button>
            <button
              type="button"
              onClick={() => { setTipoRegistro('falta'); resetTipo() }}
              className={`text-left p-4 rounded-xl border-2 transition-all ${
                tipoRegistro === 'falta'
                  ? 'border-purple-400 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-bold text-sm">📋 Falta al Manual</div>
              <div className="text-xs text-gray-500 mt-1 leading-snug">
                Incumplimiento de normas institucionales (uniforme, celular, tareas, etc.).
                Proceso disciplinario interno.
              </div>
            </button>
          </div>
          {errors.tipoRegistro && <p className="text-red-500 text-xs">{errors.tipoRegistro}</p>}
        </div>

        {/* PASO 2 — Clasificación */}
        {tipoRegistro && (
          <div className="card space-y-3">
            <label className="block font-bold text-gray-700">
              {tipoRegistro === 'situacion' ? 'Tipo de Situación *' : 'Gravedad de la Falta *'}
            </label>

            {tipoRegistro === 'situacion' && (
              <div className="space-y-1 text-xs text-gray-400 mb-2 bg-blue-50 rounded-lg p-3">
                <p>📌 Según el <strong>Decreto 1965/2013</strong> — Ley 1620 (Sistema Nacional de Convivencia Escolar)</p>
              </div>
            )}
            {tipoRegistro === 'falta' && (
              <div className="space-y-1 text-xs text-gray-400 mb-2 bg-purple-50 rounded-lg p-3">
                <p>📌 Según el <strong>Manual de Convivencia IERD Uriel Murcia 2026</strong> — Proceso disciplinario interno</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Object.entries(trackData).map(([key, info]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => { setTipoFalta(key); setCategoria('') }}
                  className={`text-left p-3 rounded-xl border-2 transition-all ${
                    tipoFalta === key ? info.color : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold text-sm">{info.badge}</div>
                  <div className="text-xs text-gray-500 mt-1 leading-snug">{info.desc}</div>
                </button>
              ))}
            </div>
            {errors.tipoFalta && <p className="text-red-500 text-xs">{errors.tipoFalta}</p>}
          </div>
        )}

        {/* PASO 3 — Categoría */}
        {claseActual && (
          <div className="card">
            <label className="block font-bold text-gray-700 text-sm mb-2">Categoría específica *</label>
            <select
              value={categoria}
              onChange={e => setCategoria(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-verde focus:outline-none"
            >
              <option value="">— Selecciona la categoría —</option>
              {claseActual.categorias.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.categoria && <p className="text-red-500 text-xs mt-1">{errors.categoria}</p>}
          </div>
        )}

        {/* PASO 4 — Descripción */}
        {tipoFalta && (
          <div className="card">
            <label className="block font-bold text-gray-700 text-sm mb-2">
              Descripción de los hechos *
            </label>
            <textarea
              rows={4}
              placeholder="Describe los hechos de forma objetiva: qué ocurrió, dónde, cuándo y quiénes estuvieron involucrados..."
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-verde focus:outline-none resize-none"
            />
            <div className="flex items-center justify-between mt-1">
              {errors.descripcion
                ? <p className="text-red-500 text-xs">{errors.descripcion}</p>
                : <span className="text-xs text-gray-400">Mínimo 10 caracteres</span>
              }
              <span className="text-xs text-gray-400">{descripcion.length} car.</span>
            </div>
          </div>
        )}

        {/* PASO 5 — Acciones inmediatas */}
        {tipoFalta && (
          <div className="card">
            <label className="block font-bold text-gray-700 text-sm mb-1">
              Acciones inmediatas tomadas <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <p className="text-xs text-gray-400 mb-2">
              {tipoRegistro === 'situacion'
                ? 'Ej: Separé a los involucrados, diálogo de mediación, llamado de atención verbal...'
                : 'Ej: Le pedí que se cambiara el uniforme, diálogo sobre la norma, le informé al director de grupo...'}
            </p>
            <textarea
              rows={2}
              placeholder="¿Qué acción tomaste en el momento?"
              value={acciones}
              onChange={e => setAcciones(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-verde focus:outline-none resize-none"
            />
          </div>
        )}

        {errors.general && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
            {errors.general}
          </div>
        )}

        {tipoFalta && (
          <div className="flex gap-3">
            <button type="submit" disabled={sending} className="btn-primary flex-1 py-3 text-base">
              {sending ? '⏳ Guardando...' : '💾 Guardar Registro'}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="border-2 border-gray-200 text-gray-600 font-semibold px-6 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        )}
      </form>
    </div>
  )
}
