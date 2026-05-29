import { useState } from 'react'

// ── Datos del conducto regular ────────────────────────────────
const SITUACIONES = [
  {
    id: 'tipo1',
    titulo: 'Situación Tipo I',
    color: 'border-yellow-400 bg-yellow-50',
    headerColor: 'bg-yellow-400',
    icono: '🟡',
    decreto: 'Art. 40 — Decreto 1965/2013',
    definicion:
      'Conflictos manejables dentro de la institución: altercados, mal comportamiento, irrespeto verbal leve, incumplimiento de normas del Manual. NO involucra agresión física ni daño grave.',
    ejemplos: [
      'Interrupciones reiteradas en clase',
      'Vocabulario inapropiado leve',
      'Incumplimiento de tareas o uniformes',
      'Conflictos verbales entre estudiantes sin agresión',
      'Daño menor a materiales de la institución',
    ],
    pasos: [
      { quien: 'Docente', accion: 'Intervención inmediata: llamado de atención verbal dentro del aula.' },
      { quien: 'Docente', accion: 'Registro en el Observador del Estudiante con descripción precisa del hecho.' },
      { quien: 'Docente / Orientación', accion: 'Reunión de concertación entre las partes involucradas.' },
      { quien: 'Docente', accion: 'Acuerdo de compromiso firmado por el estudiante.' },
      { quien: 'Docente', accion: 'Seguimiento durante los 15 días hábiles siguientes para verificar cambio de conducta.' },
      { quien: 'Coordinación', accion: 'Si persiste o escala, se activa el protocolo de Situación Tipo II.' },
    ],
    tiempo: 'Resolución inmediata dentro de la jornada. Seguimiento: 15 días hábiles.',
    nota: 'El docente es el primer responsable de la gestión. Solo escala si la situación persiste o supera su capacidad de manejo.',
  },
  {
    id: 'tipo2',
    titulo: 'Situación Tipo II',
    color: 'border-orange-400 bg-orange-50',
    headerColor: 'bg-orange-400',
    icono: '🟠',
    decreto: 'Art. 42 — Decreto 1965/2013',
    definicion:
      'Agresiones (física, verbal, gestual, relacional o electrónica), acoso escolar o ciberacoso que NO constituyen delito pero generan daño emocional, físico o patrimonial a alguna parte.',
    ejemplos: [
      'Agresión física entre estudiantes (golpes, empujones)',
      'Acoso o matoneo reiterado',
      'Publicación de contenido ofensivo en redes (ciberbullying)',
      'Amenazas o intimidación entre pares',
      'Daño intencional a objetos de otro estudiante',
    ],
    pasos: [
      { quien: 'Docente / Coordinador', accion: 'Separación inmediata de las partes. Atención a posibles lesiones.' },
      { quien: 'Coordinador', accion: 'Citación a padres/acudientes de todas las partes involucradas (máx. 3 días hábiles).' },
      { quien: 'Comité de Convivencia', accion: 'Reunión del Comité Escolar de Convivencia para análisis del caso.' },
      { quien: 'Comité de Convivencia', accion: 'Construcción de acuerdo de convivencia restaurativo con compromisos de ambas partes.' },
      { quien: 'Orientación / Coordinación', accion: 'Activación del protocolo interno de atención. Acompañamiento psicosocial si se requiere.' },
      { quien: 'Rector / Coordinador', accion: 'Seguimiento al cumplimiento del acuerdo durante 30 días. Registro en el SIMAT si aplica.' },
      { quien: 'Rector', accion: 'Si hay reincidencia o la situación escala, activar Situación Tipo III y articular con entidades externas.' },
    ],
    tiempo: 'Respuesta inicial: máximo 2 días hábiles. Comité: máximo 5 días hábiles. Seguimiento: 30 días.',
    nota: 'Esta situación DEBE quedar registrada en el observador y reportada al rector. El comité de convivencia es obligatorio.',
  },
  {
    id: 'tipo3',
    titulo: 'Situación Tipo III',
    color: 'border-red-500 bg-red-50',
    headerColor: 'bg-red-500',
    icono: '🔴',
    decreto: 'Art. 44 — Decreto 1965/2013',
    definicion:
      'Situaciones que constituyen presuntos delitos contra niños, niñas y adolescentes: violencia sexual, porte de armas, consumo o tráfico de sustancias psicoactivas, lesiones personales graves, entre otros.',
    ejemplos: [
      'Violencia o abuso sexual dentro o fuera de la institución',
      'Porte, uso o venta de armas o explosivos',
      'Tráfico o venta de sustancias psicoactivas',
      'Lesiones físicas graves que requieren atención médica',
      'Cualquier hecho que configure delito según el Código Penal',
    ],
    pasos: [
      { quien: 'Docente / Directivo', accion: 'Atención inmediata y garantía de seguridad de la víctima. No confrontar al presunto agresor.' },
      { quien: 'Rector', accion: 'Notificación inmediata (mismo día) a padres/acudientes de la víctima.' },
      { quien: 'Rector', accion: 'Reporte obligatorio a las autoridades competentes: Policía de Infancia, ICBF, Comisaría de Familia o Fiscalía según el caso.' },
      { quien: 'Rector / Orientación', accion: 'Activación de la Ruta de Atención Integral del SRPA o Sistema de Salud según corresponda.' },
      { quien: 'Comité de Convivencia', accion: 'Análisis del caso sin interferir con la investigación de autoridades. No realizar conciliaciones en situaciones Tipo III.' },
      { quien: 'Rector', accion: 'Elaboración de informe para el Sistema de Información Unificado de Convivencia Escolar (SIUCE).' },
      { quien: 'Todos', accion: 'Seguimiento con entidades externas. Garantizar medidas de protección para la víctima durante el proceso.' },
    ],
    tiempo: 'Acción INMEDIATA el mismo día del hecho. No hay plazo: se actúa de forma urgente.',
    nota: '⚠️ En Situación Tipo III la institución NO puede conciliar ni mediar. Su rol es proteger a la víctima y activar las autoridades competentes.',
  },
]

const FALTAS = [
  {
    id: 'leve',
    titulo: 'Falta Leve',
    color: 'border-green-400 bg-green-50',
    headerColor: 'bg-green-400',
    icono: '🟢',
    definicion:
      'Comportamientos que alteran el orden escolar de forma menor y no causan daño significativo a personas ni a la institución. Primera o segunda ocurrencia de un comportamiento inadecuado.',
    ejemplos: [
      'Impuntualidad reiterada sin justificación',
      'No portar o dañar elementos del uniforme',
      'Uso de celular o dispositivos sin autorización',
      'Falta de materiales de trabajo',
      'Conducta irrespetuosa leve con compañeros',
    ],
    pasos: [
      { quien: 'Docente', accion: 'Llamado de atención verbal y registro en el Observador.' },
      { quien: 'Docente', accion: 'Firma de compromiso de no repetición por parte del estudiante.' },
      { quien: 'Docente', accion: 'Comunicado informativo al acudiente (puede ser verbal, escrito o digital).' },
      { quien: 'Docente', accion: 'Seguimiento semanal durante un mes.' },
    ],
    sancion: 'Llamado de atención oral y escrito. Firma de compromiso.',
    tiempo: 'Resolución dentro de 48 horas.',
  },
  {
    id: 'grave',
    titulo: 'Falta Grave',
    color: 'border-orange-400 bg-orange-50',
    headerColor: 'bg-orange-400',
    icono: '🟠',
    definicion:
      'Comportamientos que afectan el buen desarrollo del proceso educativo, la integridad o los derechos de los demás. Reincidencia en faltas leves o primera ocurrencia de comportamientos serios.',
    ejemplos: [
      'Reincidencia en tres o más faltas leves',
      'Irrespeto grave a docentes o directivos',
      'Fraude o plagio en evaluaciones',
      'Daño intencional a bienes ajenos',
      'Ausentismo injustificado reiterado',
      'Vocabulario soez o agresivo de forma persistente',
    ],
    pasos: [
      { quien: 'Coordinador', accion: 'Citación formal al acudiente (máximo 2 días hábiles).' },
      { quien: 'Coordinador + Acudiente', accion: 'Reunión de descargos: el estudiante expone su versión.' },
      { quien: 'Coordinador', accion: 'Firma de acta de compromiso por estudiante y acudiente.' },
      { quien: 'Orientación', accion: 'Remisión a orientación escolar para acompañamiento.' },
      { quien: 'Coordinador', accion: 'Seguimiento quincenal durante 6 semanas. Registro en el observador.' },
      { quien: 'Rector', accion: 'Si persiste, se inicia proceso disciplinario formal ante el Consejo Directivo.' },
    ],
    sancion: 'Anotación formal en el observador. Citación al acudiente. Posible suspensión de 1 a 3 días según el Manual.',
    tiempo: 'Citación al acudiente: máximo 2 días hábiles. Proceso completo: máximo 10 días hábiles.',
  },
  {
    id: 'gravisima',
    titulo: 'Falta Gravísima',
    color: 'border-red-500 bg-red-50',
    headerColor: 'bg-red-500',
    icono: '🔴',
    definicion:
      'Comportamientos que vulneran gravemente los derechos de la comunidad educativa, afectan la convivencia escolar de forma severa o implican conductas tipificadas en el Manual como causales de matrícula condicional.',
    ejemplos: [
      'Agresión física grave a compañeros, docentes o directivos',
      'Porte o uso de armas u objetos peligrosos',
      'Consumo o distribución de sustancias psicoactivas en la institución',
      'Acoso sexual a compañeros o personal de la institución',
      'Hurto con violencia o intimidación',
      'Reincidencia en faltas graves sin mejora demostrable',
    ],
    pasos: [
      { quien: 'Rector / Coordinador', accion: 'Suspensión preventiva inmediata según el Manual (máximo lo permitido por ley).' },
      { quien: 'Rector', accion: 'Notificación inmediata a los padres/acudientes y entrega formal del estudiante.' },
      { quien: 'Consejo Directivo', accion: 'Convocatoria en los 5 días siguientes para proceso disciplinario formal.' },
      { quien: 'Estudiante + Acudiente', accion: 'Audiencia de descargos ante el Consejo Directivo. Derecho al debido proceso.' },
      { quien: 'Consejo Directivo', accion: 'Fallo y decisión: matrícula condicional, cambio de jornada u otras medidas del Manual.' },
      { quien: 'Rector', accion: 'Si hay presuntos delitos, activar simultáneamente el protocolo de Situación Tipo III.' },
      { quien: 'Orientación + Rector', accion: 'Plan de intervención y seguimiento mensual si el estudiante continúa en la institución.' },
    ],
    sancion: 'Matrícula condicional. Posible cambio de jornada o institución. Reporte a autoridades si hay delito.',
    tiempo: 'Proceso completo ante el Consejo Directivo: máximo 15 días hábiles.',
  },
]

const JUSTICIA_RESTAURATIVA = [
  {
    titulo: 'Círculos de Paz',
    icono: '⭕',
    descripcion:
      'Espacio de diálogo estructurado donde todas las partes (víctima, agresor, testigos, docente, orientador) se sientan en círculo para hablar sobre lo ocurrido, el daño causado y cómo repararlo.',
    cuando: 'Ideal para Situaciones Tipo I y faltas leves/graves con disposición de las partes.',
    pasos: [
      'El orientador o docente capacitado facilita el espacio.',
      'Se establecen reglas de escucha y respeto.',
      'Cada persona habla sobre cómo fue afectada.',
      'Se construye colectivamente un acuerdo de reparación.',
      'Se firma el acuerdo y se fija seguimiento.',
    ],
  },
  {
    titulo: 'Mediación Escolar',
    icono: '🤝',
    descripcion:
      'Proceso voluntario donde un tercero imparcial (docente, orientador o par mediador entrenado) ayuda a las partes en conflicto a comunicarse y encontrar una solución mutuamente aceptable.',
    cuando: 'Conflictos entre estudiantes de Tipo I o II sin agresión física. No aplica en Tipo III.',
    pasos: [
      'Consentimiento voluntario de ambas partes.',
      'El mediador garantiza un espacio neutro y confidencial.',
      'Cada parte expresa su posición sin interrupciones.',
      'El mediador identifica intereses comunes.',
      'Redacción de acuerdo y firma.',
    ],
  },
  {
    titulo: 'Acuerdos de Convivencia',
    icono: '📜',
    descripcion:
      'Documento formal que recoge los compromisos asumidos por el estudiante (y su acudiente) para reparar el daño causado y cambiar la conducta problemática.',
    cuando: 'Complemento de cualquier intervención, especialmente en Tipo II y faltas graves.',
    pasos: [
      'Redacción clara de los compromisos específicos (no genéricos).',
      'Firma del estudiante, acudiente, docente y directivo.',
      'Fechas concretas de revisión del cumplimiento.',
      'Consecuencias claras en caso de incumplimiento.',
      'Copia para el expediente y copia para el acudiente.',
    ],
  },
  {
    titulo: 'Seguimiento Restaurativo',
    icono: '🔄',
    descripcion:
      'Proceso de acompañamiento continuo para verificar que los acuerdos se cumplan y que la relación entre las partes mejore progresivamente.',
    cuando: 'Obligatorio después de cualquier proceso restaurativo.',
    pasos: [
      'Entrevistas individuales con las partes a las 2, 4 y 8 semanas.',
      'Registro de avances en el observador.',
      'Reunión de cierre cuando se cumplan todos los compromisos.',
      'Si no hay avance en 4 semanas, escalar al siguiente nivel de atención.',
    ],
  },
]

function Paso({ numero, quien, accion }) {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-700 text-white text-xs flex items-center justify-center font-bold mt-0.5">
        {numero}
      </div>
      <div>
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{quien}: </span>
        <span className="text-sm text-gray-700">{accion}</span>
      </div>
    </div>
  )
}

function TarjetaSituacion({ s, abierto, onToggle }) {
  return (
    <div className={`border-2 rounded-2xl overflow-hidden ${s.color}`}>
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-5 py-4 ${s.headerColor} text-white text-left`}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{s.icono}</span>
          <div>
            <div className="font-bold text-base">{s.titulo}</div>
            <div className="text-xs opacity-80">{s.decreto}</div>
          </div>
        </div>
        <span className="text-xl">{abierto ? '▲' : '▼'}</span>
      </button>

      {abierto && (
        <div className="px-5 py-5 space-y-4">
          {/* Definición */}
          <p className="text-sm text-gray-700 leading-relaxed">{s.definicion}</p>

          {/* Ejemplos */}
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Ejemplos</div>
            <ul className="space-y-1">
              {s.ejemplos.map((ej, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-700">
                  <span className="text-gray-400 mt-0.5">•</span>
                  {ej}
                </li>
              ))}
            </ul>
          </div>

          {/* Protocolo paso a paso */}
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Conducto Regular — Paso a Paso</div>
            <div className="space-y-3">
              {s.pasos.map((p, i) => (
                <Paso key={i} numero={i + 1} quien={p.quien} accion={p.accion} />
              ))}
            </div>
          </div>

          {/* Tiempo y nota */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white/60 rounded-xl p-3">
              <div className="text-xs font-bold text-gray-500 mb-1">⏱️ Tiempos</div>
              <p className="text-xs text-gray-700">{s.tiempo}</p>
            </div>
            {s.nota && (
              <div className="bg-white/60 rounded-xl p-3">
                <div className="text-xs font-bold text-gray-500 mb-1">📌 Nota importante</div>
                <p className="text-xs text-gray-700">{s.nota}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function TarjetaFalta({ f, abierto, onToggle }) {
  return (
    <div className={`border-2 rounded-2xl overflow-hidden ${f.color}`}>
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-5 py-4 ${f.headerColor} text-white text-left`}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{f.icono}</span>
          <div className="font-bold text-base">{f.titulo}</div>
        </div>
        <span className="text-xl">{abierto ? '▲' : '▼'}</span>
      </button>

      {abierto && (
        <div className="px-5 py-5 space-y-4">
          <p className="text-sm text-gray-700 leading-relaxed">{f.definicion}</p>

          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Ejemplos</div>
            <ul className="space-y-1">
              {f.ejemplos.map((ej, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-700">
                  <span className="text-gray-400">•</span>{ej}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Conducto Regular</div>
            <div className="space-y-3">
              {f.pasos.map((p, i) => (
                <Paso key={i} numero={i + 1} quien={p.quien} accion={p.accion} />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white/60 rounded-xl p-3">
              <div className="text-xs font-bold text-gray-500 mb-1">⚖️ Sanción aplicable</div>
              <p className="text-xs text-gray-700">{f.sancion}</p>
            </div>
            <div className="bg-white/60 rounded-xl p-3">
              <div className="text-xs font-bold text-gray-500 mb-1">⏱️ Tiempos</div>
              <p className="text-xs text-gray-700">{f.tiempo}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ConductoRegular() {
  const [abierto, setAbierto] = useState({})
  const [tab, setTab] = useState('situaciones')

  function toggle(id) {
    setAbierto(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Encabezado */}
      <div className="bg-gradient-to-r from-verde to-verde-light rounded-2xl p-6 text-white">
        <h1 className="text-xl font-bold">⚖️ Conducto Regular y Justicia Restaurativa</h1>
        <p className="text-green-100 text-sm mt-1">
          IERD Uriel Murcia · Basado en el Decreto 1965/2013 y el Manual de Convivencia Institucional
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          <span className="bg-white/20 text-xs px-2 py-1 rounded-full">Ley 1620/2013</span>
          <span className="bg-white/20 text-xs px-2 py-1 rounded-full">Decreto 1965/2013</span>
          <span className="bg-white/20 text-xs px-2 py-1 rounded-full">Manual de Convivencia</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {[
          { key: 'situaciones', label: '📋 Situaciones Tipo I/II/III', sub: 'Decreto 1965/2013' },
          { key: 'faltas', label: '📌 Faltas al Manual', sub: 'Manual Interno' },
          { key: 'restaurativa', label: '🕊️ Justicia Restaurativa', sub: 'Métodos alternativos' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors text-left ${
              tab === t.key
                ? 'border-verde text-verde'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <div>{t.label}</div>
            <div className={`text-xs font-normal ${tab === t.key ? 'text-verde/70' : 'text-gray-300'}`}>{t.sub}</div>
          </button>
        ))}
      </div>

      {/* Contenido por tab */}
      {tab === 'situaciones' && (
        <div className="space-y-4">
          <div className="card text-sm text-gray-600 leading-relaxed">
            <p>
              La <strong>Ley 1620/2013</strong> y su decreto reglamentario clasifican las situaciones que afectan la convivencia escolar en tres tipos, cada uno con un protocolo de atención diferenciado.
              El objetivo es garantizar el debido proceso, la protección de los estudiantes y la restauración de la convivencia.
            </p>
          </div>
          {SITUACIONES.map(s => (
            <TarjetaSituacion
              key={s.id}
              s={s}
              abierto={!!abierto[s.id]}
              onToggle={() => toggle(s.id)}
            />
          ))}
        </div>
      )}

      {tab === 'faltas' && (
        <div className="space-y-4">
          <div className="card text-sm text-gray-600 leading-relaxed">
            <p>
              El <strong>Manual de Convivencia</strong> de la IERD Uriel Murcia clasifica las faltas en tres niveles según su gravedad.
              Para cada nivel existe un conducto regular específico que garantiza el debido proceso, la participación del acudiente y las medidas restaurativas correspondientes.
            </p>
          </div>
          {FALTAS.map(f => (
            <TarjetaFalta
              key={f.id}
              f={f}
              abierto={!!abierto[f.id]}
              onToggle={() => toggle(f.id)}
            />
          ))}
        </div>
      )}

      {tab === 'restaurativa' && (
        <div className="space-y-4">
          <div className="card text-sm text-gray-600 leading-relaxed">
            <p>
              La <strong>Justicia Restaurativa</strong> busca reparar el daño causado, restaurar las relaciones afectadas y reintegrar al estudiante a la comunidad educativa.
              Complementa (no reemplaza) los procesos disciplinarios establecidos. Su aplicación es preferente en Situaciones Tipo I y II.
            </p>
          </div>

          {JUSTICIA_RESTAURATIVA.map((m, i) => (
            <div key={i} className="border-2 border-verde/30 rounded-2xl overflow-hidden bg-green-50">
              <button
                onClick={() => toggle(`jr_${i}`)}
                className="w-full flex items-center justify-between px-5 py-4 bg-verde text-white text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{m.icono}</span>
                  <div>
                    <div className="font-bold text-base">{m.titulo}</div>
                    <div className="text-xs opacity-80">{m.cuando}</div>
                  </div>
                </div>
                <span className="text-xl">{abierto[`jr_${i}`] ? '▲' : '▼'}</span>
              </button>

              {abierto[`jr_${i}`] && (
                <div className="px-5 py-5 space-y-4">
                  <p className="text-sm text-gray-700 leading-relaxed">{m.descripcion}</p>
                  <div>
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Pasos del proceso</div>
                    <div className="space-y-2">
                      {m.pasos.map((p, pi) => (
                        <div key={pi} className="flex gap-3">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-verde text-white text-xs flex items-center justify-center font-bold mt-0.5">
                            {pi + 1}
                          </div>
                          <p className="text-sm text-gray-700">{p}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white/70 rounded-xl p-3">
                    <div className="text-xs font-bold text-gray-500 mb-1">📅 ¿Cuándo aplicar?</div>
                    <p className="text-xs text-gray-700">{m.cuando}</p>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Marco normativo */}
          <div className="card border-l-4 border-verde">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">📚 Marco Normativo</div>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• <strong>Ley 1620/2013</strong>: Sistema Nacional de Convivencia Escolar</li>
              <li>• <strong>Decreto 1965/2013</strong>: Reglamentación de la Ley 1620 (rutas de atención, tipos de situación)</li>
              <li>• <strong>Código de Infancia y Adolescencia (Ley 1098/2006)</strong>: Derechos y garantías de los NNA</li>
              <li>• <strong>Manual de Convivencia IERD Uriel Murcia</strong>: Clasificación de faltas y sanciones internas</li>
              <li>• <strong>Decreto 1290/2009</strong>: Evaluación y promoción escolar</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
