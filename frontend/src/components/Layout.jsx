import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'

const nav = [
  { to: '/',                  label: 'Dashboard',    icon: '📊' },
  { to: '/estudiantes',       label: 'Estudiantes',  icon: '🎒' },
  { to: '/seguimientos',      label: 'Seguimientos', icon: '📋' },
  { to: '/conducto-regular',  label: 'Protocolo',    icon: '⚖️' },
  { to: '/reportes',          label: 'Reportes',     icon: '📈' },
  { to: '/docentes',          label: 'Docentes',     icon: '👩‍🏫', rol: ['admin', 'coordinador', 'rector'] },
]

export default function Layout() {
  const navigate = useNavigate()
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')
  const [menuOpen, setMenuOpen] = useState(false)

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    navigate('/login')
  }

  const navItems = nav.filter(n => !n.rol || n.rol.includes(usuario.rol))

  return (
    <div className="min-h-screen flex flex-col">
      {/* HEADER */}
      <header className="bg-verde text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🦅</span>
            <div>
              <div className="font-bold text-sm leading-tight">ObservadorUriel</div>
              <div className="text-xs text-green-200 hidden sm:block">IERD Uriel Murcia</div>
            </div>
          </div>

          {/* Nav desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(n => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                   ${isActive ? 'bg-white/20 text-white' : 'text-green-100 hover:bg-white/10 hover:text-white'}`
                }
              >
                <span>{n.icon}</span>{n.label}
              </NavLink>
            ))}
          </nav>

          {/* Usuario */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <div className="text-sm font-semibold">{usuario.nombres}</div>
              <div className="text-xs text-green-200 capitalize">{usuario.rol}</div>
            </div>
            <button
              onClick={logout}
              className="bg-white/10 hover:bg-white/20 text-white text-sm px-3 py-1.5 rounded-lg transition-colors"
            >
              Salir
            </button>
            {/* Mobile menu btn */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden bg-white/10 p-1.5 rounded-lg"
            >
              ☰
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <div className="md:hidden bg-verde-light border-t border-white/10 px-4 pb-3">
            {navItems.map(n => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === '/'}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-lg my-0.5 text-sm font-medium transition-colors
                   ${isActive ? 'bg-white/20 text-white' : 'text-green-100 hover:bg-white/10'}`
                }
              >
                {n.icon} {n.label}
              </NavLink>
            ))}
          </div>
        )}
      </header>

      {/* MAIN */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        <Outlet />
      </main>

      <footer className="bg-verde text-green-200 text-center text-xs py-3">
        ObservadorUriel · IERD Uriel Murcia · Yacopí, Cundinamarca · 2026
      </footer>
    </div>
  )
}
