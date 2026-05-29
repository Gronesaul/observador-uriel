import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getEstudiantes, getSedes, getGrados, crearEstudiante } from '../api'

const GRADOS_ORDEN = [
  'GRADO 0', 'PRIMERO', 'SEGUNDO', 'TERCERO', 'CUARTO', 'QUINTO',
  'SEXTO', 'SEPTIMO', 'OCTAVO', 'NOVENO', 'DÉCIMO', 'ONCE',
]

const GENEROS = ['Masculino', 'Femenino', 'Otro', 'Prefiero no decir']

const FORM_INICIAL = {
  nombres: '',
  apellidos: '',
  documento: '',
  sede: '',
  grado: '',
  grupo: '',
  edad: '',
  genero: '',
  nombre_acudiente: '',
  telefono_acudiente: '',
}

export default function BuscarEstudiante() {
  const navigate = useNavigate()
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')
  const puedeCrear = ['admin', 'rector', 'coordinador', 'docente'].includes(usuario.rol)

  const [estudiantes, setEstudiantes] = useState([])
  const [sedes, setSedes] = useState([])
  const [grados, setGrados] = useState([])
  const [filtros, setFiltros] = useState({ buscar: '', sede: '', grado: '' })
  const [loading, setLoading] = useState(false)

  // Modal de nuevo estudiante
  const [modalAbierto, setModalAbierto] = useState(false)
  const [form, setForm] = useState(FORM_INICIAL)
  const [guardando, setGuardando] = useState(false)
  const [errorModal, setErrorModal] = useState('')

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

  function abrirModal() {
    setForm(FORM_INICIAL)
    setErrorModal('')
    setModalAbierto(true)
  }

  function cerrarModal() {
    setModalAbierto(false)
    setErrorModal('')
  }

  async function handleCrearEstudiante(e) {
    e.preventDefault()
    if (!form.nombres.trim() || !form.apellidos.trim() || !form.documento.trim() || !form.sede.trim()) {
      setErrorModal('Nombres, apellidos, documento y sede son obligatorios.')
      return
    }
    setGuardando(true)
    setErrorModal('')
    try {
      const payload = {
        ...form,
        edad: form.edad ? parseInt(form.edad) : null,
      }
      const { data } = await crearEstudiante(payload)
      setModalAbierto(false)
      // Navegar directamente a la ficha del nuevo estudiante
      navigate(`/estudiantes/${data.id}`)
    } catch (err) {
      const detalle = err.response?.data?.detail
      setErrorModal(detalle || 'Error al crear el estudiante. Verifique los datos.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">🎒 Estudiantes</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">{estudiantes.length} resultados</span>
          {puedeCrear && (
            <button
              onClick={abrirModal}
              className="btn-primary text-sm flex items-center gap-1.5"
            >
              <span className="text-base">➕</span> Nuevo Estudiante
            </button>
          )}
        </div>
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

      {/* ── MODAL NUEVO ESTUDIANTE ── */}
      {modalAbierto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={e => { if (e.target === e.currentTarget) cerrarModal() }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-lg font-bold text-gray-800">➕ Nuevo Estudiante</h2>
              <button onClick={cerrarModal} className="text-gray-400 hover:text-gray-700 text-xl leading-none">✕</button>
            </div>

            <form onSubmit={handleCrearEstudiante} className="px-6 py-5 space-y-4">
              {errorModal && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                  ⚠️ {errorModal}
                </div>
              )}

              {/* Nombres y apellidos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Nombres *</label>
                  <input
                    type="text"
                    placeholder="Ej: María Fernanda"
                    value={form.nombres}
                    onChange={e => setForm({ ...form, nombres: e.target.value })}
                    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-verde focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Apellidos *</label>
                  <input
                    type="text"
                    placeholder="Ej: García López"
                    value={form.apellidos}
                    onChange={e => setForm({ ...form, apellidos: e.target.value })}
                    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-verde focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Documento */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Número de documento *</label>
                <input
                  type="text"
                  placeholder="NUIP, tarjeta de identidad, etc."
                  value={form.documento}
                  onChange={e => setForm({ ...form, documento: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-verde focus:outline-none"
                  required
                />
              </div>

              {/* Sede y grado */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Sede *</label>
                  <select
                    value={form.sede}
                    onChange={e => setForm({ ...form, sede: e.target.value })}
                    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-verde focus:outline-none"
                    required
                  >
                    <option value="">Seleccionar sede...</option>
                    {sedes.map(s => <option key={s} value={s}>{s}</option>)}
                    <option value="Nueva sede">+ Otra sede</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Grado</label>
                  <select
                    value={form.grado}
                    onChange={e => setForm({ ...form, grado: e.target.value })}
                    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-verde focus:outline-none"
                  >
                    <option value="">Seleccionar grado...</option>
                    {GRADOS_ORDEN.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>

              {/* Grupo, edad, género */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Grupo</label>
                  <input
                    type="text"
                    placeholder="A, B..."
                    value={form.grupo}
                    onChange={e => setForm({ ...form, grupo: e.target.value })}
                    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-verde focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Edad</label>
                  <input
                    type="number"
                    placeholder="12"
                    min="3"
                    max="25"
                    value={form.edad}
                    onChange={e => setForm({ ...form, edad: e.target.value })}
                    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-verde focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Género</label>
                  <select
                    value={form.genero}
                    onChange={e => setForm({ ...form, genero: e.target.value })}
                    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-verde focus:outline-none"
                  >
                    <option value="">—</option>
                    {GENEROS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>

              {/* Acudiente */}
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Acudiente (opcional)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre del acudiente</label>
                    <input
                      type="text"
                      placeholder="Nombre completo"
                      value={form.nombre_acudiente}
                      onChange={e => setForm({ ...form, nombre_acudiente: e.target.value })}
                      className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-verde focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Teléfono (WhatsApp)</label>
                    <input
                      type="tel"
                      placeholder="57 300 000 0000"
                      value={form.telefono_acudiente}
                      onChange={e => setForm({ ...form, telefono_acudiente: e.target.value })}
                      className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-verde focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={guardando}
                  className="btn-primary flex-1"
                >
                  {guardando ? 'Guardando...' : '✅ Crear Estudiante'}
                </button>
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="px-5 py-2 rounded-xl border-2 border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
