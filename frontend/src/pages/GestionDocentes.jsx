import { useEffect, useState } from 'react'
import { getDocentes, crearDocente } from '../api'

const SEDES = [
  'Guadualito',
  'Centro',
  'El Turmal',
  'La Cañada',
  'La Palma',
  'La Pradera',
  'Las Malvinas',
  'Los Alpes',
  'Molinos',
  'San Isidro',
  'Santa Helena',
]

const ROL_LABELS = {
  docente:      '👩‍🏫 Docente',
  coordinador:  '👔 Coordinador',
  admin:        '⚙️ Admin',
}

const ROL_COLORS = {
  docente:      'bg-blue-100 text-blue-700',
  coordinador:  'bg-purple-100 text-purple-700',
  admin:        'bg-gray-100 text-gray-700',
}

const FORM_INICIAL = {
  nombres: '', apellidos: '', documento: '', email: '',
  contrasena: '', sede: '', rol: 'docente',
}

export default function GestionDocentes() {
  const [docentes, setDocentes]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm]           = useState(FORM_INICIAL)
  const [errors, setErrors]       = useState({})
  const [saving, setSaving]       = useState(false)
  const [exito, setExito]         = useState('')
  const [buscar, setBuscar]       = useState('')
  const [filtroSede, setFiltroSede] = useState('')

  async function cargar() {
    setLoading(true)
    try {
      const { data } = await getDocentes()
      setDocentes(data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { cargar() }, [])

  function validar() {
    const e = {}
    if (!form.nombres.trim())    e.nombres    = 'Requerido'
    if (!form.apellidos.trim())  e.apellidos  = 'Requerido'
    if (!form.documento.trim())  e.documento  = 'Requerido'
    if (!form.contrasena || form.contrasena.length < 6) e.contrasena = 'Mínimo 6 caracteres'
    if (!form.sede)              e.sede       = 'Selecciona la sede'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleCrear(e) {
    e.preventDefault()
    if (!validar()) return
    setSaving(true)
    try {
      await crearDocente(form)
      setExito(`✅ ${form.nombres} ${form.apellidos} creado correctamente.`)
      setForm(FORM_INICIAL)
      setMostrarForm(false)
      cargar()
      setTimeout(() => setExito(''), 4000)
    } catch (err) {
      setErrors({ general: err.response?.data?.detail || 'Error al crear el docente.' })
    } finally {
      setSaving(false)
    }
  }

  const filtrados = docentes.filter(d => {
    const texto = `${d.nombres} ${d.apellidos} ${d.documento}`.toLowerCase()
    const matchTexto = !buscar || texto.includes(buscar.toLowerCase())
    const matchSede  = !filtroSede || d.sede === filtroSede
    return matchTexto && matchSede
  })

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">👩‍🏫 Gestión de Docentes</h1>
        <button
          onClick={() => { setMostrarForm(!mostrarForm); setErrors({}); setForm(FORM_INICIAL) }}
          className="btn-primary"
        >
          {mostrarForm ? '✕ Cancelar' : '➕ Nuevo Docente'}
        </button>
      </div>

      {exito && (
        <div className="bg-green-50 border-2 border-green-400 rounded-xl px-4 py-3 text-green-700 text-sm font-semibold">
          {exito}
        </div>
      )}

      {/* Formulario de creación */}
      {mostrarForm && (
        <div className="card border-2 border-verde/30">
          <h2 className="font-bold text-gray-700 mb-4 text-base">Crear nuevo usuario docente</h2>
          <form onSubmit={handleCrear} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nombres *</label>
                <input
                  type="text"
                  value={form.nombres}
                  onChange={e => setForm({ ...form, nombres: e.target.value })}
                  placeholder="Ej: María del Carmen"
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-verde focus:outline-none"
                />
                {errors.nombres && <p className="text-red-500 text-xs mt-1">{errors.nombres}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Apellidos *</label>
                <input
                  type="text"
                  value={form.apellidos}
                  onChange={e => setForm({ ...form, apellidos: e.target.value })}
                  placeholder="Ej: García Rodríguez"
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-verde focus:outline-none"
                />
                {errors.apellidos && <p className="text-red-500 text-xs mt-1">{errors.apellidos}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Documento (usuario) *</label>
                <input
                  type="text"
                  value={form.documento}
                  onChange={e => setForm({ ...form, documento: e.target.value })}
                  placeholder="Ej: 12345678"
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-verde focus:outline-none"
                />
                {errors.documento && <p className="text-red-500 text-xs mt-1">{errors.documento}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Contraseña inicial *
                </label>
                <input
                  type="text"
                  value={form.contrasena}
                  onChange={e => setForm({ ...form, contrasena: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-verde focus:outline-none"
                />
                {errors.contrasena && <p className="text-red-500 text-xs mt-1">{errors.contrasena}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Sede *</label>
                <select
                  value={form.sede}
                  onChange={e => setForm({ ...form, sede: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-verde focus:outline-none"
                >
                  <option value="">— Seleccionar sede —</option>
                  {SEDES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {errors.sede && <p className="text-red-500 text-xs mt-1">{errors.sede}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Rol</label>
                <select
                  value={form.rol}
                  onChange={e => setForm({ ...form, rol: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-verde focus:outline-none"
                >
                  <option value="docente">Docente</option>
                  <option value="coordinador">Coordinador</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Email <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="correo@ejemplo.com"
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-verde focus:outline-none"
                />
              </div>
            </div>

            {errors.general && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                {errors.general}
              </div>
            )}

            <div className="flex items-center gap-3 pt-1">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Creando...' : '💾 Crear Docente'}
              </button>
              <p className="text-xs text-gray-400">
                El docente podrá iniciar sesión con su documento y contraseña inicial.
              </p>
            </div>
          </form>
        </div>
      )}

      {/* Filtros */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Buscar por nombre o documento..."
            value={buscar}
            onChange={e => setBuscar(e.target.value)}
            className="border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-verde focus:outline-none"
          />
          <select
            value={filtroSede}
            onChange={e => setFiltroSede(e.target.value)}
            className="border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-verde focus:outline-none"
          >
            <option value="">Todas las sedes</option>
            {SEDES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Lista de docentes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-700 text-sm">
            Docentes registrados ({filtrados.length})
          </h2>
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-12">Cargando...</div>
        ) : filtrados.length === 0 ? (
          <div className="card text-center text-gray-400 py-12">
            No se encontraron docentes con esos filtros.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtrados.map(d => (
              <div key={d.id} className={`card flex items-start gap-3 ${!d.activo ? 'opacity-50' : ''}`}>
                <div className="w-10 h-10 rounded-full bg-verde/10 text-verde flex items-center justify-center font-bold text-base shrink-0">
                  {d.nombres.charAt(0)}{d.apellidos.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-gray-800 truncate">
                    {d.nombres} {d.apellidos}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">Doc: {d.documento}</div>
                  <div className="text-xs text-gray-400">{d.sede}</div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROL_COLORS[d.rol] || 'bg-gray-100 text-gray-600'}`}>
                      {ROL_LABELS[d.rol] || d.rol}
                    </span>
                    {!d.activo && (
                      <span className="text-xs text-red-500 font-semibold">Inactivo</span>
                    )}
                  </div>
                  {d.email && <div className="text-xs text-gray-400 mt-0.5 truncate">✉️ {d.email}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
