import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ documento: '', contrasena: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-verde to-verde-light flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🦅</div>
          <h1 className="text-2xl font-bold text-verde">ObservadorUriel</h1>
          <p className="text-gray-500 text-sm mt-1">Sistema de Observador del Estudiante</p>
          <p className="text-gray-400 text-xs mt-0.5">IERD Uriel Murcia · Yacopí, Cundinamarca</p>
        </div>

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
              Contraseña
            </label>
            <input
              type="password"
              value={form.contrasena}
              onChange={e => setForm({ ...form, contrasena: e.target.value })}
              placeholder="Contraseña"
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-verde focus:outline-none transition-colors"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 text-base"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-200">
          <p className="text-xs text-green-700 font-semibold mb-1">Credenciales iniciales:</p>
          <p className="text-xs text-green-600">Admin: <strong>admin</strong> / <strong>docente2026</strong></p>
          <p className="text-xs text-green-600">Rector: <strong>rector</strong> / <strong>rector2026</strong></p>
          <p className="text-xs text-green-500 mt-1">Cambia las contraseñas después del primer ingreso.</p>
        </div>
      </div>
    </div>
  )
}
