import { Navigate, Route, Routes, useLocation, type Location } from 'react-router-dom'
import { AuthProvider } from './lib/auth/AuthContext'
import { EditEntryPage } from './routes/EditEntryPage'
import { EntriesPage } from './routes/EntriesPage'
import { LoginPage } from './routes/LoginPage'
import { RequireAuth } from './routes/RequireAuth'

interface NavigationState {
  backgroundLocation?: Location
}

function App() {
  const location = useLocation()
  // Set by EntriesPage's Edit link so the edit route renders as a modal over the list instead
  // of replacing it, while staying a real, bookmarkable route on its own. Direct navigation
  // (no background state) falls back to rendering it standalone.
  const backgroundLocation = (location.state as NavigationState | null)?.backgroundLocation

  return (
    <AuthProvider>
      <Routes location={backgroundLocation ?? location}>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <EntriesPage />
            </RequireAuth>
          }
        />
        <Route
          path="/entries/:id/edit"
          element={
            <RequireAuth>
              <EditEntryPage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {backgroundLocation && (
        <Routes>
          <Route
            path="/entries/:id/edit"
            element={
              <RequireAuth>
                <EditEntryPage />
              </RequireAuth>
            }
          />
        </Routes>
      )}
    </AuthProvider>
  )
}

export default App
