import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getResumen, getSeguimientosActivos } from '../api'

const PROTOCOLO_COLORES = {
  llamado_atencion: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  citacion_padres:  'bg-orange-100 text-orange-800 border-orange-300',
  comite_convivencia: 'bg-red-100 text-red-700 border-red-300',
  ruta_atencion:    'bg-red-200 text-red-900 border-red-400',
  policia_infancia: 'bg-red-300 text-red-900 border-red-500',
}

const PROTOCOLO_LABELS = {
  llamado_atencion:   '🟡 Llamado de Atención',
  citacion_padres:    '🟠 Citación al Acudiente',
  comite_convivencia: '🔴 Comité de Convivencia',
  ruta_atencion:      '🚨 Ruta de Atención Integral',
  policia_infancia:   '🚔 Policía de Infancia',
}

export default function Dashboard() {
  const navigate = useNavigate()
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')
  const [resumen, setResumen] = useState(null)
  const [activos, setActivos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getResumen(), getSeguimientosActivos()])
      .then(([r, s]) => { setResumen(r.data); setActivos(s.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Cargando...</div>

  return (
    <div className="space-y-6">
      {/* Bienvenida */}
      <div className="bg-gradient-to-r from-verde to-verde-light rounded-2xl p-6 text-white">
        <h1 className="text-xl font-bold">Bienvenido, {usuario.nombres} 👋</h1>
        <p className="text-green-100 text-sm mt-1">
          {usuario.sede || 'IERD Uriel Murcia'} · {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Tarjetas de resumen */}
      {resumen && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card border-l-4 border-verde">
            <div className="text-3xl font-bold text-verde">{resumen.total_estudiantes}</div>
            <div className="text-sm text-gray-500 mt-1">Estudiantes</div>
          </div>
          <div className="card border-l-4 border-yellow-400">
            <div className="text-3xl font-bold text-yellow-600">{resumen.tipo1}</div>
            <div className="text-sm text-gray-500 mt-1">Faltas Tipo I</div>
          </div>
          <div className="card border-l-4 border-orange-400">
            <div className="text-3xl font-bold text-orange-600">{resumen.tipo2}</div>
            <div className="text-sm text-gray-500 mt-1">Faltas Tipo II</div>
          </div>
          <div className="card border-l-4 border-red-500">
            <div className="text-3xl font-bold text-red-600">{resumen.tipo3}</div>
            <div className="text-sm text-gray-500 mt-1">Faltas Tipo III</div>
          </div>
        </div>
      )}

      {/* Acciones rápidas */}
      <div>
        <h2 className="text-base font-bold text-gray-700 mb-3">⚡ Acciones Rápidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <button
            onClick={() => navigate('/estudiantes')}
            className="card hover:shadow-lg transition-shadow text-left cursor-pointer border-2 border-transparent hover:border-verde"
          >
            <div className="text-2xl mb-2">🔍</div>
            <div className="font-semibold text-sm">Buscar Estudiante</div>
            <div className="text-xs text-gray-400 mt-0.5">Ver ficha y agregar anotación</div>
          </button>
          <button
            onClick={() => navigate('/seguimientos')}
            className="card hover:shadow-lg transition-shadow text-left cursor-pointer border-2 border-transparent hover:border-orange-400"
          >
            <div className="text-2xl mb-2">📋</div>
            <div className="font-semibold text-sm">Seguimientos</div>
            <div className="text-xs text-gray-400 mt-0.5">
              {resumen?.seguimientos_pendientes || 0} pendientes
            </div>
          </button>
          <button
            onClick={() => navigate('/reportes')}
            className="card hover:shadow-lg transition-shadow text-left cursor-pointer border-2 border-transparent hover:border-blue-400"
          >
            <div className="text-2xl mb-2">📈</div>
            <div className="font-semibold text-sm">Reportes</div>
            <div className="text-xs text-gray-400 mt-0.5">Estadísticas por sede y grado</div>
          </button>
        </div>
      </div>

      {/* Seguimientos activos */}
      {activos.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-gray-700 mb-3">
            🚨 Seguimientos Activos ({activos.length})
          </h2>
          <div className="space-y-2">
            {activos.slice(0, 8).map(s => (
              <div
                key={s.id}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer hover:shadow-md transition-shadow ${PROTOCOLO_COLORES[s.tipo_accion] || 'bg-gray-50 border-gray-200'}`}
                onClick={() => navigate(`/estudiantes/${s.id}`)}
              >
                <div>
                  <div className="font-semibold text-sm">{s.estudiante}</div>
                  <div className="text-xs opacity-75">{s.sede} · {s.grado}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold">{PROTOCOLO_LABELS[s.tipo_accion] || s.tipo_accion}</div>
                  <div className="text-xs opacity-60">{new Date(s.fecha_apertura).toLocaleDateString('es-CO')}</div>
                </div>
              </div>
            ))}
          </div>
          {activos.length > 8 && (
            <button onClick={() => navigate('/seguimientos')} className="text-sm text-verde font-semibold mt-2 hover:underline">
              Ver todos ({activos.length}) →
            </button>
          )}
        </div>
      )}

      {/* Alerta sin notificar */}
      {resumen?.sin_notificar_acudiente > 0 && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">📱</span>
          <div>
            <div className="font-semibold text-amber-800 text-sm">
              {resumen.sin_notificar_acudiente} anotaciones sin notificar al acudiente
            </div>
            <div className="text-xs text-amber-600 mt-0.5">
              Entra a la ficha del estudiante y usa el botón de WhatsApp para notificar.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
