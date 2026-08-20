import { useEffect, useState } from 'react'
import {
  getDocentes, crearDocente, getAsignaciones, crearAsignacion, eliminarAsignacion,
  getSedes, getGrados, getDocentesPendientes, crearDocentePendiente, eliminarDocentePendiente,
} from '../api'

// Sedes reales según "PLANO MATRICULA JULIO 22 DE 2026.xls" — secundaria, mixta
// y las 8 escuelas rurales de primaria. Usar estos mismos nombres al precargar
// docentes para que la pantalla de activación agrupe bien por sede.
const SEDES = [
  'I.E.D. Uriel Murcia (sede central, Aposentos)',
  'I.E. Post-Primaria Rural Guadualito',
  'Escuela Rural Yasal Alto',
  'Escuela Rural Los Ángeles de Aposentos',
  'Escuela Rural El Lamal',
  'Escuela Rural El Chapón',
  'Escuela Rural El Banco',
  'Escuela Rural Cabo Verde',
  'Escuela Rural Pasurcha',
  'Escuela Rural Yasal Bajo',
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

const FORM_ASIGNACION_INICIAL = { docente_id: '', sede: '', grado: '', grupo: '' }

export default function GestionDocentes() {
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')
  const esSuperior = ['admin', 'rector'].includes(usuario.rol)

  const [docentes, setDocentes]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm]           = useState(FORM_INICIAL)
  const [errors, setErrors]       = useState({})
  const [saving, setSaving]       = useState(false)
  const [exito, setExito]         = useState('')
  const [buscar, setBuscar]       = useState('')
  const [filtroSede, setFiltroSede] = useState('')

  // Asignación de grupos (director de curso)
  const [asignaciones, setAsignaciones] = useState([])
  const [sedesEst, setSedesEst] = useState([])
  const [gradosEst, setGradosEst] = useState([])
  const [formAsig, setFormAsig] = useState(FORM_ASIGNACION_INICIAL)
  const [errorAsig, setErrorAsig] = useState('')
  const [guardandoAsig, setGuardandoAsig] = useState(false)

  // Precarga de nombres — el docente activa su propia cuenta con PIN
  const [pendientes, setPendientes] = useState([])
  const [formPend, setFormPend] = useState({ nombres: '', apellidos: '', sede: '', rol: 'docente' })
  const [errorPend, setErrorPend] = useState('')
  const [guardandoPend, setGuardandoPend] = useState(false)

  async function cargar() {
    setLoading(true)
    try {
      const { data } = await getDocentes()
      setDocentes(data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  async function cargarAsignaciones() {
    try {
      const { data } = await getAsignaciones()
      setAsignaciones(data)
    } catch (e) { console.error(e) }
  }

  async function cargarPendientes() {
    try {
      const { data } = await getDocentesPendientes()
      setPendientes(data)
    } catch (e) { console.error(e) }
  }

  useEffect(() => {
    cargar()
    if (esSuperior) {
      cargarAsignaciones()
      cargarPendientes()
      getSedes().then(r => setSedesEst(r.data)).catch(console.error)
      getGrados().then(r => setGradosEst(r.data)).catch(console.error)
    }
  }, [])

  async function handleCrearPendiente(e) {
    e.preventDefault()
    setErrorPend('')
    if (!formPend.nombres.trim() || !formPend.apellidos.trim() || !formPend.sede) {
      setErrorPend('Nombres, apellidos y sede son obligatorios.')
      return
    }
    setGuardandoPend(true)
    try {
      await crearDocentePendiente(formPend)
      setFormPend({ nombres: '', apellidos: '', sede: '', rol: 'docente' })
      cargarPendientes()
    } catch (err) {
      setErrorPend(err.response?.data?.detail || 'No se pudo precargar el nombre.')
    } finally {
      setGuardandoPend(false)
    }
  }

  async function handleEliminarPendiente(id) {
    try {
      await eliminarDocentePendiente(id)
      cargarPendientes()
    } catch (e) { console.error(e) }
  }

  async function handleCrearAsignacion(e) {
    e.preventDefault()
    setErrorAsig('')
    if (!formAsig.docente_id || !formAsig.sede || !formAsig.grado) {
      setErrorAsig('Selecciona docente, sede y grado.')
      return
    }
    setGuardandoAsig(true)
    try {
      await crearAsignacion({
        docente_id: parseInt(formAsig.docente_id),
        sede: formAsig.sede,
        grado: formAsig.grado,
        grupo: formAsig.grupo || null,
      })
      setFormAsig(FORM_ASIGNACION_INICIAL)
      cargarAsignaciones()
    } catch (err) {
      setErrorAsig(err.response?.data?.detail || 'No se pudo crear la asignación.')
    } finally {
      setGuardandoAsig(false)
    }
  }

  async function handleEliminarAsignacion(id) {
    try {
      await eliminarAsignacion(id)
      cargarAsignaciones()
    } catch (e) { console.error(e) }
  }

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

      {/* Precarga de nombres — autoactivación por PIN — solo rector/admin */}
      {esSuperior && (
        <div className="pt-2 border-t border-gray-200">
          <h2 className="font-bold text-gray-700 text-base mt-4 mb-1">🪪 Precargar Docentes (activación con PIN)</h2>
          <p className="text-xs text-gray-400 mb-3">
            Carga solo el nombre y la sede. El docente entra a la pantalla de login, elige su nombre,
            pone su cédula y crea su propio PIN — no necesitas asignarle contraseña tú.
          </p>

          <div className="card mb-3">
            <form onSubmit={handleCrearPendiente} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
              <input
                type="text" placeholder="Nombres" value={formPend.nombres}
                onChange={e => setFormPend({ ...formPend, nombres: e.target.value })}
                className="border-2 border-gray-200 rounded-lg px-2 py-2 text-sm focus:border-verde focus:outline-none"
              />
              <input
                type="text" placeholder="Apellidos" value={formPend.apellidos}
                onChange={e => setFormPend({ ...formPend, apellidos: e.target.value })}
                className="border-2 border-gray-200 rounded-lg px-2 py-2 text-sm focus:border-verde focus:outline-none"
              />
              <select
                value={formPend.sede}
                onChange={e => setFormPend({ ...formPend, sede: e.target.value })}
                className="border-2 border-gray-200 rounded-lg px-2 py-2 text-sm focus:border-verde focus:outline-none"
              >
                <option value="">Sede…</option>
                {SEDES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select
                value={formPend.rol}
                onChange={e => setFormPend({ ...formPend, rol: e.target.value })}
                className="border-2 border-gray-200 rounded-lg px-2 py-2 text-sm focus:border-verde focus:outline-none"
              >
                <option value="docente">Docente</option>
                <option value="coordinador">Coordinador / Secretaría</option>
                <option value="admin">Admin / Rector</option>
              </select>
              <button type="submit" disabled={guardandoPend} className="btn-primary text-sm md:col-span-4 w-fit">
                {guardandoPend ? 'Guardando...' : '➕ Precargar nombre'}
              </button>
            </form>
            {errorPend && <p className="text-red-500 text-xs mt-2">{errorPend}</p>}
          </div>

          {pendientes.length === 0 ? (
            <div className="card text-center text-gray-400 py-6 text-sm">
              Sin nombres pendientes de activación.
            </div>
          ) : (
            <div className="space-y-2">
              {pendientes.map(p => (
                <div key={p.id} className="card flex items-center justify-between text-sm py-3">
                  <div>
                    <span className="font-semibold text-gray-700">{p.nombres} {p.apellidos}</span>
                    <span className="text-gray-400"> — {p.sede} · {ROL_LABELS[p.rol] || p.rol}</span>
                    <span className="ml-2 text-xs text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded-full">
                      Pendiente de activar
                    </span>
                  </div>
                  <button onClick={() => handleEliminarPendiente(p.id)} className="text-red-500 text-xs hover:underline">
                    Quitar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Asignación de grupos — solo rector/admin */}
      {esSuperior && (
        <div className="pt-2 border-t border-gray-200">
          <h2 className="font-bold text-gray-700 text-base mt-4 mb-1">🎯 Directores de Grupo</h2>
          <p className="text-xs text-gray-400 mb-3">
            Solo el docente asignado como director/a de un sede+grado(+grupo) puede editar el perfil
            (foto, datos) de los estudiantes de ese curso. Admin y rector siempre pueden.
          </p>

          <div className="card mb-3">
            <form onSubmit={handleCrearAsignacion} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Docente</label>
                <select
                  value={formAsig.docente_id}
                  onChange={e => setFormAsig({ ...formAsig, docente_id: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-lg px-2 py-2 text-sm focus:border-verde focus:outline-none"
                >
                  <option value="">Seleccionar…</option>
                  {docentes.map(d => (
                    <option key={d.id} value={d.id}>{d.nombres} {d.apellidos}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Sede</label>
                <select
                  value={formAsig.sede}
                  onChange={e => setFormAsig({ ...formAsig, sede: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-lg px-2 py-2 text-sm focus:border-verde focus:outline-none"
                >
                  <option value="">—</option>
                  {sedesEst.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Grado</label>
                <select
                  value={formAsig.grado}
                  onChange={e => setFormAsig({ ...formAsig, grado: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-lg px-2 py-2 text-sm focus:border-verde focus:outline-none"
                >
                  <option value="">—</option>
                  {gradosEst.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Grupo (opcional)</label>
                <input
                  type="text" placeholder="Ej. 601"
                  value={formAsig.grupo}
                  onChange={e => setFormAsig({ ...formAsig, grupo: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-lg px-2 py-2 text-sm focus:border-verde focus:outline-none"
                />
              </div>
              <button type="submit" disabled={guardandoAsig} className="btn-primary text-sm md:col-span-5 w-fit">
                {guardandoAsig ? 'Guardando...' : '➕ Asignar'}
              </button>
            </form>
            {errorAsig && <p className="text-red-500 text-xs mt-2">{errorAsig}</p>}
            <p className="text-xs text-gray-400 mt-2">Deja "Grupo" en blanco para asignar todo el grado en esa sede.</p>
          </div>

          {asignaciones.length === 0 ? (
            <div className="card text-center text-gray-400 py-6 text-sm">Sin asignaciones todavía.</div>
          ) : (
            <div className="space-y-2">
              {asignaciones.map(a => (
                <div key={a.id} className="card flex items-center justify-between text-sm py-3">
                  <div>
                    <span className="font-semibold text-gray-700">{a.docente_nombre}</span>
                    <span className="text-gray-400"> — {a.sede} · {a.grado}{a.grupo ? ` (${a.grupo})` : ' · todo el grado'}</span>
                  </div>
                  <button onClick={() => handleEliminarAsignacion(a.id)} className="text-red-500 text-xs hover:underline">
                    Quitar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
