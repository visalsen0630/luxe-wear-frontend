import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { currentUser, userRole } = useAuth()

  if (!currentUser) return <Navigate to="/login" replace />
  if (adminOnly && userRole !== 'admin') return <Navigate to="/" replace />

  return children
}
