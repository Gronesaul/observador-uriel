import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, getSedesPendientes, getPendientesPorSede, activarCuenta } from '../api'

export default function Login() {
  const navigate = useNavigate()
  const [modo, setModo] = useState('login') // "login" | "activar"

  // ── Login ──
  const [form, setForm] = useState({ documento: '', contrasena: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // ── Activación ──
  const [sedes, setSedes] = useState([])
  const [sedeElegida, setSedeElegida] = useState('')
  const [pendientes, setPendientes] = useState([])
  const [usuarioId, setUsuarioId] = useState('')
  const [documentoNuevo, setDocumentoNuevo] = useState('')
  const [pin, setPin] = useState('')
  const [pinConfirmar, setPinConfirmar] = useState('')
  const [errorActivar, setErrorActivar] = useState('')
  const [activando, setActivando] = useState(false)
  const [exitoActivacion, setExitoActivacion] = useState('')

  useEffect(() => {
    if (modo === 'activar' && sedes.length === 0) {
      getSedesPendientes().then(r => setSedes(r.data)).catch(console.error)
    }
  }, [modo])

  useEffect(() => {
    setPendientes([])
    setUsuarioId('')
    if (sedeElegida) {
      getPendientesPorSede(sedeElegida).then(r => setPendientes(r.data)).catch(console.error)
    }
  }, [sedeElegida])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await login(form.documento, form.contrasena)
      localStorage.setItem('token', data.access_token)
      localStorage.setItem('usuario', JSON.stringify(data.usuario))
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Error de conexión. Verifica tu usuario y contraseña.')
    } finally {
      setLoading(false)
    }
  }

  async function handleActivar(e) {
    e.preventDefault()
    setErrorActivar('')
    if (!usuarioId) { setErrorActivar('Selecciona tu nombre en la lista.'); return }
    if (!documentoNuevo.trim() || documentoNuevo.trim().length < 4) {
      setErrorActivar('Ingresa tu número de documento completo.'); return
    }
    if (!/^\d{4,6}$/.test(pin)) { setErrorActivar('El PIN debe ser de 4 a 6 números.'); return }
    if (pin !== pinConfirmar) { setErrorActivar('Los dos PIN no coinciden.'); return }

    setActivando(true)
    try {
      await activarCuenta({ usuario_id: parseInt(usuarioId), documento: documentoNuevo.trim(), pin })
      setExitoActivacion('✅ Cuenta activada. Ya puedes iniciar sesión con tu documento y tu PIN.')
      setForm({ documento: documentoNuevo.trim(), contrasena: '' })
      setTimeout(() => { setModo('login'); setExitoActivacion('') }, 2200)
    } catch (err) {
      setErrorActivar(err.response?.data?.detail || 'No se pudo activar la cuenta.')
    } finally {
      setActivando(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-verde to-verde-light flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🦅</div>
          <h1 className="text-2xl font-bold text-verde">ObservadorUriel</h1>
          <p className="text-gray-500 text-sm mt-1">Sistema de Observador del Estudiante</p>
          <p className="text-gray-400 text-xs mt-0.5">IERD Uriel Murcia · Yacopí, Cundinamarca</p>
        </div>

        {modo === 'login' ? (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Documento / Usuario
                </label>
                <input
                  type="text"
                  value={form.documento}
                  onChange={e => setForm({ ...form, documento: e.target.value })}
                  placeholder="Número de documento"
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-verde focus:outline-none transition-colors"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Contraseña / PIN
                </label>
                <input
                  type="password"
                  value={form.contrasena}
                  onChange={e => setForm({ ...form, contrasena: e.target.value })}
                  placeholder="Contraseña o PIN"
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-verde focus:outline-none transition-colors"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
                {loading ? 'Ingresando...' : 'Ingresar'}
              </button>
            </form>

            <button
              onClick={() => setModo('activar')}
              className="w-full text-center text-sm text-verde hover:underline mt-5"
            >
              ¿Eres docente nuevo/a? Activa tu cuenta aquí
            </button>
          </>
        ) : (
          <form onSubmit={handleActivar} className="space-y-4">
            <p className="text-sm text-gray-500 -mt-2 mb-2">
              Tu rector o coordinación ya cargó tu nombre en el sistema. Elige tu sede, busca tu nombre
              y crea tu propio PIN de acceso.
            </p>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Tu sede</label>
              <select
                value={sedeElegida}
                onChange={e => setSedeElegida(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-verde focus:outline-none"
              >
                <option value="">Selecciona tu sede…</option>
                {sedes.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {sedes.length === 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  No hay cuentas pendientes de activar todavía. Pídele a rectoría que cargue tu nombre.
                </p>
              )}
            </div>

            {sedeElegida && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Tu nombre</label>
                <select
                  value={usuarioId}
                  onChange={e => setUsuarioId(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-verde focus:outline-none"
                >
                  <option value="">Selecciona tu nombre…</option>
                  {pendientes.map(p => (
                    <option key={p.id} value={p.id}>{p.nombres} {p.apellidos}</option>
                  ))}
                </select>
                {sedeElegida && pendientes.length === 0 && (
                  <p className="text-xs text-gray-400 mt-1">No hay nombres pendientes en esa sede.</p>
                )}
              </div>
            )}

            {usuarioId && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Tu número de documento</label>
                  <input
                    type="text"
                    value={documentoNuevo}
                    onChange={e => setDocumentoNuevo(e.target.value)}
                    placeholder="Cédula, sin puntos"
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-verde focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Crea tu PIN</label>
                    <input
                      type="password" inputMode="numeric" maxLength={6}
                      value={pin}
                      onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="4 a 6 números"
                      className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-verde focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Confirma tu PIN</label>
                    <input
                      type="password" inputMode="numeric" maxLength={6}
                      value={pinConfirmar}
                      onChange={e => setPinConfirmar(e.target.value.replace(/\D/g, ''))}
                      placeholder="Repite el PIN"
                      className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-verde focus:outline-none"
                    />
                  </div>
                </div>
              </>
            )}

            {errorActivar && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                {errorActivar}
              </div>
            )}
            {exitoActivacion && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">
                {exitoActivacion}
              </div>
            )}

            <button type="submit" disabled={activando || !usuarioId} className="btn-primary w-full py-3 text-base">
              {activando ? 'Activando...' : 'Activar mi cuenta'}
            </button>

            <button
              type="button"
              onClick={() => { setModo('login'); setErrorActivar('') }}
              className="w-full text-center text-sm text-verde hover:underline"
            >
              ← Ya tengo cuenta, quiero iniciar sesión
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
