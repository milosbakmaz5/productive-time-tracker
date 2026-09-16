import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './lib/auth/AuthContext'
import { EntriesPage } from './routes/EntriesPage'
import { LoginPage } from './routes/LoginPage'
import { RequireAuth } from './routes/RequireAuth'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <EntriesPage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
