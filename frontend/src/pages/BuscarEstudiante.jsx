import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getEstudiantes, getSedes, getGrados } from '../api'

export default function BuscarEstudiante() {
  const navigate = useNavigate()
  const [estudiantes, setEstudiantes] = useState([])
  const [sedes, setSedes] = useState([])
  const [grados, setGrados] = useState([])
  const [filtros, setFiltros] = useState({ buscar: '', sede: '', grado: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getSedes().then(r => setSedes(r.data))
    getGrados().then(r => setGrados(r.data))
    buscar()
  }, [])

  async function buscar() {
    setLoading(true)
    try {
      const params = {}
      if (filtros.buscar) params.buscar = filtros.buscar
      if (filtros.sede) params.sede = filtros.sede
      if (filtros.grado) params.grado = filtros.grado
      const { data } = await getEstudiantes(params)
      setEstudiantes(data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  function handleKey(e) { if (e.key === 'Enter') buscar() }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">🎒 Estudiantes</h1>
        <span className="text-sm text-gray-400">{estudiantes.length} resultados</span>
      </div>

      {/* Filtros */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Buscar por nombre o documento..."
            value={filtros.buscar}
            onChange={e => setFiltros({ ...filtros, buscar: e.target.value })}
            onKeyDown={handleKey}
            className="border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-verde focus:outline-none"
          />
          <select
            value={filtros.sede}
            onChange={e => setFiltros({ ...filtros, sede: e.target.value })}
            className="border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-verde focus:outline-none"
          >
            <option value="">Todas las sedes</option>
            {sedes.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={filtros.grado}
            onChange={e => setFiltros({ ...filtros, grado: e.target.value })}
            className="border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-verde focus:outline-none"
          >
            <option value="">Todos los grados</option>
            {grados.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <button onClick={buscar} className="btn-primary mt-3 px-6">Buscar</button>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="text-center text-gray-400 py-12">Buscando...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {estudiantes.map(est => (
            <div
              key={est.id}
              onClick={() => navigate(`/estudiantes/${est.id}`)}
              className="card cursor-pointer hover:shadow-lg hover:border-verde border-2 border-transparent transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-sm text-gray-800">
                    {est.nombres} {est.apellidos}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">Doc: {est.documento}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  est.grado === 'ONCE' || est.grado === 'DÉCIMO' ? 'bg-blue-100 text-blue-700' :
                  est.grado === 'SEXTO' || est.grado === 'SEPTIMO' ? 'bg-purple-100 text-purple-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {est.grado}
                </span>
              </div>
              <div className="mt-2 text-xs text-gray-400 truncate">{est.sede}</div>
              {est.telefono_acudiente && (
                <div className="mt-1 text-xs text-green-600">📱 Acudiente registrado</div>
              )}
            </div>
          ))}
          {!loading && estudiantes.length === 0 && (
            <div className="col-span-3 text-center text-gray-400 py-12">
              No se encontraron estudiantes con esos filtros.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
