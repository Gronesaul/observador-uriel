import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getReportePorSede, getTopEstudiantes, getResumen } from '../api'

export default function Reportes() {
  const navigate = useNavigate()
  const [resumen, setResumen]       = useState(null)
  const [porSede, setPorSede]       = useState([])
  const [topEst, setTopEst]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [tabActiva, setTabActiva]   = useState('general')

  useEffect(() => {
    Promise.all([getResumen(), getReportePorSede(), getTopEstudiantes()])
      .then(([r, s, t]) => {
        setResumen(r.data)
        setPorSede(s.data)
        setTopEst(t.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Cargando reportes...</div>

  const totalAnotaciones = (resumen?.tipo1 || 0) + (resumen?.tipo2 || 0) + (resumen?.tipo3 || 0)

  // Barras proporcionales para tipos
  const maxTipo = Math.max(resumen?.tipo1 || 0, resumen?.tipo2 || 0, resumen?.tipo3 || 0, 1)

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">📈 Reportes y Estadísticas</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {[
          { key: 'general', label: '📊 General' },
          { key: 'sedes',   label: '🏫 Por Sede' },
          { key: 'top',     label: '🎒 Top Estudiantes' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTabActiva(key)}
            className={`pb-2 px-3 text-sm font-semibold border-b-2 transition-colors ${
              tabActiva === key
                ? 'border-verde text-verde'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── TAB GENERAL ── */}
      {tabActiva === 'general' && resumen && (
        <div className="space-y-4">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card border-l-4 border-verde text-center">
              <div className="text-3xl font-bold text-verde">{resumen.total_estudiantes}</div>
              <div className="text-xs text-gray-500 mt-1">Estudiantes</div>
            </div>
            <div className="card border-l-4 border-blue-400 text-center">
              <div className="text-3xl font-bold text-blue-600">{totalAnotaciones}</div>
              <div className="text-xs text-gray-500 mt-1">Total Anotaciones</div>
            </div>
            <div className="card border-l-4 border-orange-400 text-center">
              <div className="text-3xl font-bold text-orange-600">{resumen.seguimientos_pendientes || 0}</div>
              <div className="text-xs text-gray-500 mt-1">Seguimientos Activos</div>
            </div>
            <div className="card border-l-4 border-amber-400 text-center">
              <div className="text-3xl font-bold text-amber-600">{resumen.sin_notificar_acudiente || 0}</div>
              <div className="text-xs text-gray-500 mt-1">Sin Notificar</div>
            </div>
          </div>

          {/* Distribución por tipo */}
          <div className="card">
            <h2 className="font-bold text-gray-700 mb-4">Distribución por Tipo de Falta</h2>
            <div className="space-y-4">
              {[
                { key: 'tipo1', label: '🟡 Tipo I — Leve',      value: resumen.tipo1, color: 'bg-yellow-400' },
                { key: 'tipo2', label: '🟠 Tipo II — Grave',     value: resumen.tipo2, color: 'bg-orange-500' },
                { key: 'tipo3', label: '🔴 Tipo III — Gravísima', value: resumen.tipo3, color: 'bg-red-500' },
              ].map(({ key, label, value, color }) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{label}</span>
                    <span className="text-sm font-bold text-gray-800">{value}</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${color} rounded-full transition-all`}
                      style={{ width: `${(value / maxTipo) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            {totalAnotaciones > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100 flex gap-4 text-xs text-gray-500">
                <span>Tipo I: {Math.round((resumen.tipo1 / totalAnotaciones) * 100)}%</span>
                <span>Tipo II: {Math.round((resumen.tipo2 / totalAnotaciones) * 100)}%</span>
                <span>Tipo III: {Math.round((resumen.tipo3 / totalAnotaciones) * 100)}%</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB SEDES ── */}
      {tabActiva === 'sedes' && (
        <div className="space-y-3">
          {porSede.length === 0 ? (
            <div className="card text-center text-gray-400 py-12">Sin datos por sede.</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {porSede.map((s, i) => {
                  const total = (s.tipo1 || 0) + (s.tipo2 || 0) + (s.tipo3 || 0)
                  const maxSede = Math.max(...porSede.map(x => (x.tipo1||0)+(x.tipo2||0)+(x.tipo3||0)), 1)
                  return (
                    <div key={s.sede} className="card">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-semibold text-sm text-gray-800 truncate">{s.sede}</div>
                          <div className="text-xs text-gray-400">{s.estudiantes} estudiantes</div>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <div className="text-lg font-bold text-gray-700">{total}</div>
                          <div className="text-xs text-gray-400">anotaciones</div>
                        </div>
                      </div>
                      {/* Mini barra */}
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mt-1">
                        <div
                          className="h-full bg-verde rounded-full"
                          style={{ width: `${(total / maxSede) * 100}%` }}
                        />
                      </div>
                      <div className="flex gap-3 mt-2 text-xs text-gray-500">
                        <span className="text-yellow-600">T1: {s.tipo1 || 0}</span>
                        <span className="text-orange-600">T2: {s.tipo2 || 0}</span>
                        <span className="text-red-600">T3: {s.tipo3 || 0}</span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Tabla resumen */}
              <div className="card overflow-x-auto">
                <h3 className="font-bold text-gray-700 mb-3 text-sm">Resumen por sede</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-400 border-b">
                      <th className="text-left pb-2">Sede</th>
                      <th className="text-right pb-2">Est.</th>
                      <th className="text-right pb-2 text-yellow-600">T1</th>
                      <th className="text-right pb-2 text-orange-600">T2</th>
                      <th className="text-right pb-2 text-red-600">T3</th>
                      <th className="text-right pb-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {porSede.map(s => (
                      <tr key={s.sede} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-2 text-gray-700 font-medium">{s.sede}</td>
                        <td className="py-2 text-right text-gray-500">{s.estudiantes}</td>
                        <td className="py-2 text-right text-yellow-600">{s.tipo1 || 0}</td>
                        <td className="py-2 text-right text-orange-600">{s.tipo2 || 0}</td>
                        <td className="py-2 text-right text-red-600">{s.tipo3 || 0}</td>
                        <td className="py-2 text-right font-bold text-gray-700">
                          {(s.tipo1||0)+(s.tipo2||0)+(s.tipo3||0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── TAB TOP ESTUDIANTES ── */}
      {tabActiva === 'top' && (
        <div className="space-y-3">
          {topEst.length === 0 ? (
            <div className="card text-center text-gray-400 py-12">Sin anotaciones registradas aún.</div>
          ) : (
            <>
              <p className="text-sm text-gray-400">Estudiantes con más anotaciones registradas en el sistema.</p>
              <div className="space-y-2">
                {topEst.map((est, i) => (
                  <div
                    key={est.id}
                    onClick={() => navigate(`/estudiantes/${est.id}`)}
                    className="card flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow border-2 border-transparent hover:border-verde"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                      i === 0 ? 'bg-yellow-100 text-yellow-700' :
                      i === 1 ? 'bg-gray-100 text-gray-600' :
                      i === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-50 text-gray-400'
                    }`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-gray-800 truncate">
                        {est.nombres} {est.apellidos}
                      </div>
                      <div className="text-xs text-gray-400">{est.grado} · {est.sede}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg font-bold text-gray-700">{est.total}</div>
                      <div className="flex gap-2 text-xs justify-end mt-0.5">
                        {est.tipo1 > 0 && <span className="text-yellow-600">T1:{est.tipo1}</span>}
                        {est.tipo2 > 0 && <span className="text-orange-600">T2:{est.tipo2}</span>}
                        {est.tipo3 > 0 && <span className="text-red-600">T3:{est.tipo3}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
