import { AuthProvider, useAuth } from './store/authStore'
import { AuthPage } from './pages/AuthPage'
import { ChatPage } from './pages/ChatPage'
import { InvitePage } from './pages/InvitePage'
import { ToastContainer } from './components/shared/Toast'

const inviteMatch = window.location.pathname.match(/^\/invite\/([a-zA-Z0-9]+)$/)

function AppInner() {
  const { isAuthed } = useAuth()
  if (inviteMatch) return <InvitePage token={inviteMatch[1]} />
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
