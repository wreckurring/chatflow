import { AuthProvider, useAuth } from './store/authStore'
import { AuthPage } from './pages/AuthPage'
import { ChatPage } from './pages/ChatPage'
import { ToastContainer } from './components/shared/Toast'

function AppInner() {
  const { isAuthed } = useAuth()
  return isAuthed ? <ChatPage /> : <AuthPage />
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
      <ToastContainer />
    </AuthProvider>
  )
}
