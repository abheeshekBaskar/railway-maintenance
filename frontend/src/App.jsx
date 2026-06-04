import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/layout/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import EquipmentPage from './pages/EquipmentPage'
import TasksPage from './pages/TasksPage'
import WorkOrdersPage from './pages/WorkOrdersPage'
import InventoryPage from './pages/InventoryPage'
import IncidentsPage from './pages/IncidentsPage'
import ReportsPage from './pages/ReportsPage'
import NotificationsPage from './pages/NotificationsPage'
import TrainingPage from './pages/TrainingPage'
import UsersPage from './pages/UsersPage'
import AuditPage from './pages/AuditPage'

function Guard({ children, roles }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"/></div>
  if (!user) return <Navigate to="/login" replace/>
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace/>
  return children
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard"/> : <LoginPage/>}/>
      <Route path="/" element={<Navigate to="/dashboard"/>}/>
      <Route element={<Guard><Layout/></Guard>}>
        <Route path="/dashboard"     element={<DashboardPage/>}/>
        <Route path="/equipment"     element={<EquipmentPage/>}/>
        <Route path="/tasks"         element={<TasksPage/>}/>
        <Route path="/work-orders"   element={<WorkOrdersPage/>}/>
        <Route path="/inventory"     element={<InventoryPage/>}/>
        <Route path="/incidents"     element={<IncidentsPage/>}/>
        <Route path="/notifications" element={<NotificationsPage/>}/>
        <Route path="/training"      element={<TrainingPage/>}/>
        <Route path="/reports"       element={<Guard roles={['admin','supervisor']}><ReportsPage/></Guard>}/>
        <Route path="/users"         element={<Guard roles={['admin']}><UsersPage/></Guard>}/>
        <Route path="/audit"         element={<Guard roles={['admin']}><AuditPage/></Guard>}/>
      </Route>
    </Routes>
  )
}

export default function App() {
  return <BrowserRouter><AuthProvider><AppRoutes/></AuthProvider></BrowserRouter>
}
