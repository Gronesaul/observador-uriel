import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({ baseURL: API_URL })

// Adjuntar token automáticamente
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

// Si 401 → logout
api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('usuario')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

// ── AUTH ──────────────────────────────────────────────
export const login = (documento, contrasena) =>
  api.post('/api/auth/login', new URLSearchParams({ username: documento, password: contrasena }), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  })

export const getMe = () => api.get('/api/auth/me')

// ── ESTUDIANTES ───────────────────────────────────────
export const getEstudiantes = (params) => api.get('/api/estudiantes/', { params })
export const getFicha = (id) => api.get(`/api/estudiantes/${id}`)
export const crearEstudiante = (data) => api.post('/api/estudiantes/', data)
export const updateAcudiente = (id, data) => api.put(`/api/estudiantes/${id}/acudiente`, data)
export const updatePerfilEstudiante = (id, data) => api.put(`/api/estudiantes/${id}/perfil`, data)
export const updateAnioIngreso = (id, anio_ingreso) => api.put(`/api/estudiantes/${id}/anio-ingreso`, { anio_ingreso })
export const getSedes = () => api.get('/api/estudiantes/sedes')
export const getGrados = () => api.get('/api/estudiantes/grados')

// ── ANOTACIONES ───────────────────────────────────────
export const crearAnotacion = (data) => api.post('/api/anotaciones/', data)
export const marcarNotificado = (id) => api.put(`/api/anotaciones/${id}/notificado`)
export const getSeguimientosPendientes = () => api.get('/api/anotaciones/seguimientos/pendientes')
export const updateSeguimiento = (id, data) => api.put(`/api/anotaciones/seguimientos/${id}`, data)

// ── DOCENTES ──────────────────────────────────────────
export const getDocentes = () => api.get('/api/docentes/')
export const crearDocente = (data) => api.post('/api/docentes/', data)

// ── REPORTES ──────────────────────────────────────────
export const getResumen = () => api.get('/api/reportes/resumen')
export const getReportePorSede = () => api.get('/api/reportes/por-sede')
export const getTopEstudiantes = () => api.get('/api/reportes/estudiantes-con-mas-anotaciones')
export const getSeguimientosActivos = () => api.get('/api/reportes/seguimientos-activos')
export const getAlertas = () => api.get('/api/reportes/alertas')

// ── GRUPOS (director de grupo) ─────────────────────────
export const getAsignaciones = () => api.get('/api/grupos/')
export const crearAsignacion = (data) => api.post('/api/grupos/', data)
export const eliminarAsignacion = (id) => api.delete(`/api/grupos/${id}`)

// ── PDF ─────────────────────────────────────────────────
export const urlPdfEstudiante = (id) => `${API_URL}/api/pdf/estudiante/${id}`
export const urlPdfActaComite = (seguimientoId) => `${API_URL}/api/pdf/acta-comite/${seguimientoId}`

// Descarga un PDF protegido (adjunta el token) y lo abre en pestaña nueva
export async function abrirPdf(url, nombreSugerido) {
  const token = localStorage.getItem('token')
  const resp = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
  if (!resp.ok) throw new Error('No se pudo generar el PDF')
  const blob = await resp.blob()
  const blobUrl = window.URL.createObjectURL(blob)
  const w = window.open(blobUrl, '_blank')
  if (!w) {
    // Popup bloqueado: forzar descarga
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = nombreSugerido || 'documento.pdf'
    a.click()
  }
  setTimeout(() => window.URL.revokeObjectURL(blobUrl), 30000)
}
