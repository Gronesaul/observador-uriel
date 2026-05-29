import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import BuscarEstudiante from './pages/BuscarEstudiante'
import FichaEstudiante from './pages/FichaEstudiante'
import NuevaAnotacion from './pages/NuevaAnotacion'
import Seguimientos from './pages/Seguimientos'
import Reportes from './pages/Reportes'
import GestionDocentes from './pages/GestionDocentes'
import ConductoRegular from './pages/ConductoRegular'
import Layout from './components/Layout'

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="estudiantes" element={<BuscarEstudiante />} />
          <Route path="estudiantes/:id" element={<FichaEstudiante />} />
          <Route path="anotar/:id" element={<NuevaAnotacion />} />
          <Route path="seguimientos" element={<Seguimientos />} />
          <Route path="reportes" element={<Reportes />} />
          <Route path="docentes" element={<GestionDocentes />} />
          <Route path="conducto-regular" element={<ConductoRegular />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
