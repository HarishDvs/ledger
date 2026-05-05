import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom'
import useWebSocket from './hooks/useWebSocket'
import { useAuth } from './context/AuthContext'
import { T } from './tokens'
import { Icon, ICONS } from './components/Icon'
import Dashboard   from './pages/Dashboard'
import LiveMonitor from './pages/LiveMonitor'
import Record      from './pages/Record'
import Verify      from './pages/Verify'
import Alerts      from './pages/Alerts'
import Login       from './pages/Login'
import Signup      from './pages/Signup'

const ACCENT = '#2563eb'
const ROLE_COLOR = { admin: '#7c3aed', officer: '#2563eb', analyst: '#059669' }

const NAV = [
  { path: '/',        label: 'Dashboard',    icon: ICONS.grid,      exact: true },
  { path: '/monitor', label: 'Live Monitor', icon: ICONS.tvMonitor              },
  { path: '/record',  label: 'Record',       icon: ICONS.video                  },
  { path: '/verify',  label: 'Verify',       icon: ICONS.check                  },
  { path: '/alerts',  label: 'AI Alerts',    icon: ICONS.bell,      badge: true },
]

function Sidebar({ alertCount, connected, user, onLogout }) {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <aside style={{ width: 240, flexShrink: 0, background: T.panel, borderRight: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '24px 20px', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${ACCENT}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon d={ICONS.shield} size={18} style={{ color: ACCENT }} />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-.01em', lineHeight: 1.2, color: T.text }}>CCTV Integrity</div>
          <div style={{ fontSize: 11, color: T.dim, letterSpacing: '.02em', marginTop: 2 }}>Evidence Platform</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map(({ path, label, icon, badge, exact }) => {
          const active = exact ? location.pathname === path : location.pathname.startsWith(path)
          const showBadge = badge && alertCount > 0
          return (
            <button key={path} onClick={() => navigate(path)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', background: active ? T.panelAlt : 'transparent', color: active ? T.text : T.muted, fontSize: 14, fontWeight: active ? 600 : 500, textAlign: 'left', width: '100%', transition: 'all .12s' }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = T.panelAlt; e.currentTarget.style.color = T.text } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.muted } }}>
              <Icon d={icon} size={18} />
              <span style={{ flex: 1 }}>{label}</span>
              {showBadge && (
                <span style={{ background: T.red, color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 12, padding: '2px 6px', minWidth: 20, textAlign: 'center' }}>
                  {alertCount > 99 ? '99+' : alertCount}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* User card + logout */}
      <div style={{ borderTop: `1px solid ${T.border}` }}>
        <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${ROLE_COLOR[user?.role] ?? ACCENT}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${ROLE_COLOR[user?.role] ?? ACCENT}30` }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: ROLE_COLOR[user?.role] ?? ACCENT }}>
              {user?.name?.[0]?.toUpperCase() ?? '?'}
            </span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
            <div style={{ fontSize: 10, color: T.dim, textTransform: 'capitalize' }}>{user?.role}</div>
          </div>
          <button onClick={onLogout} title="Sign out"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.dim, padding: 6, borderRadius: 6, display: 'flex', transition: 'all .12s' }}
            onMouseEnter={e => { e.currentTarget.style.color = T.red; e.currentTarget.style.background = T.redLight }}
            onMouseLeave={e => { e.currentTarget.style.color = T.dim; e.currentTarget.style.background = 'none' }}>
            <Icon d={ICONS.logout} size={16} />
          </button>
        </div>
        <div style={{ padding: '10px 16px', borderTop: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: connected ? T.green : T.red }} className={connected ? 'pulse' : ''} />
          <span style={{ fontSize: 12, color: T.muted, fontWeight: 500 }}>{connected ? 'AI Connected' : 'AI Offline'}</span>
        </div>
      </div>
    </aside>
  )
}

function AppShell() {
  const { isConnected, alerts, clearAlerts } = useWebSocket()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar alertCount={alerts.length} connected={isConnected} user={user}
        onLogout={() => { logout(); navigate('/login', { replace: true }) }} />
      <main style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', background: T.base }}>
        <Routes>
          <Route path="/"        element={<Dashboard   accentColor={ACCENT} />} />
          <Route path="/monitor" element={<LiveMonitor  accentColor={ACCENT} />} />
          <Route path="/record"  element={<Record       accentColor={ACCENT} />} />
          <Route path="/verify"  element={<Verify       accentColor={ACCENT} />} />
          <Route path="/alerts"  element={<Alerts alerts={alerts} clearAlerts={clearAlerts} isConnected={isConnected} accentColor={ACCENT} />} />
          <Route path="*"        element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.base }}>
        <div style={{ fontSize: 13, color: T.dim }}>Loading…</div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login"  element={user ? <Navigate to="/" replace /> : <Login  />} />
      <Route path="/signup" element={user ? <Navigate to="/" replace /> : <Signup />} />
      <Route path="/*"      element={user ? <AppShell /> : <Navigate to="/login" replace />} />
    </Routes>
  )
}
