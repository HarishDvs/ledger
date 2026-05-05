import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { T } from '../tokens'
import { Icon, ICONS } from '../components/Icon'

const ACCENT = '#2563eb'

const FEATURES = [
  { icon: ICONS.shield,      text: 'Tamper-proof SHA-256 evidence hashing' },
  { icon: ICONS.cube,        text: 'Immutable Polygon blockchain records'   },
  { icon: ICONS.tvMonitor,   text: 'Real-time public camera monitoring'     },
  { icon: ICONS.checkCircle, text: 'Cryptographic chain of custody'         },
]

export default function Login() {
  const { login }    = useAuth()
  const navigate     = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)

  const submit = async e => {
    e.preventDefault()
    if (!email || !password) { setError('Email and password are required'); return }
    setLoading(true); setError(null)
    try {
      await login(email.trim(), password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.response?.data?.error || 'Sign in failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: T.base }}>
      {/* ── Left branding panel ── */}
      <div style={{ width: 480, flexShrink: 0, background: '#0f172a', display: 'flex', flexDirection: 'column', padding: '52px 48px', position: 'relative', overflow: 'hidden' }}>
        {/* Background hex pattern */}
        <div style={{ position: 'absolute', inset: 0, opacity: .04, backgroundImage: 'radial-gradient(circle at 1px 1px, #60a5fa 1px, transparent 0)', backgroundSize: '32px 32px', pointerEvents: 'none' }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 64, position: 'relative' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: `${ACCENT}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${ACCENT}40` }}>
            <Icon d={ICONS.shield} size={22} style={{ color: '#60a5fa' }} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-.01em' }}>CCTV Integrity</div>
            <div style={{ fontSize: 11, color: '#64748b', letterSpacing: '.04em', marginTop: 1 }}>Evidence Platform</div>
          </div>
        </div>

        {/* Headline */}
        <div style={{ flex: 1, position: 'relative' }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#f1f5f9', lineHeight: 1.2, letterSpacing: '-.02em', marginBottom: 16 }}>
            Blockchain-secured<br />surveillance evidence
          </div>
          <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.7, marginBottom: 40, maxWidth: 340 }}>
            Every incident hashed, timestamped, and sealed on-chain. Tamper-proof records that hold up in court.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {FEATURES.map(({ icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: `${ACCENT}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon d={icon} size={14} style={{ color: '#60a5fa' }} />
                </div>
                <span style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.4 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(37,99,235,.12)', border: '1px solid rgba(37,99,235,.2)', borderRadius: 8, marginTop: 32 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: 12, color: '#94a3b8' }}>6 cameras online · Polygon Amoy testnet</span>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 32px' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div style={{ marginBottom: 36 }}>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: T.text, letterSpacing: '-.02em' }}>Sign in to your account</h1>
            <p style={{ fontSize: 14, color: T.muted, marginTop: 8 }}>
              Don't have an account?{' '}
              <Link to="/signup" style={{ color: ACCENT, fontWeight: 600, textDecoration: 'none' }}
                onMouseEnter={e => e.target.style.textDecoration='underline'}
                onMouseLeave={e => e.target.style.textDecoration='none'}>
                Create one
              </Link>
            </p>
          </div>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 7, letterSpacing: '.02em' }}>Email address</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.dim, pointerEvents: 'none' }}>
                  <Icon d={ICONS.mail} size={16} />
                </div>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="officer@department.gov"
                  autoComplete="email" autoFocus
                  style={{ display: 'block', width: '100%', padding: '11px 14px 11px 40px', background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 14, outline: 'none', transition: 'border-color .15s, box-shadow .15s' }}
                  onFocus={e => { e.target.style.borderColor = ACCENT; e.target.style.boxShadow = `0 0 0 3px ${ACCENT}18` }}
                  onBlur={e => { e.target.style.borderColor = T.border; e.target.style.boxShadow = 'none' }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 7, letterSpacing: '.02em' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.dim, pointerEvents: 'none' }}>
                  <Icon d={ICONS.lock} size={16} />
                </div>
                <input
                  type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{ display: 'block', width: '100%', padding: '11px 44px 11px 40px', background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 14, outline: 'none', transition: 'border-color .15s, box-shadow .15s' }}
                  onFocus={e => { e.target.style.borderColor = ACCENT; e.target.style.boxShadow = `0 0 0 3px ${ACCENT}18` }}
                  onBlur={e => { e.target.style.borderColor = T.border; e.target.style.boxShadow = 'none' }}
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: T.dim, display: 'flex', padding: 4 }}>
                  <Icon d={ICONS.eye} size={16} />
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{ background: T.redLight, border: `1px solid ${T.red}44`, color: T.red, padding: '10px 14px', borderRadius: 8, fontSize: 13 }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading}
              style={{ padding: '12px', background: loading ? T.panelAlt : ACCENT, color: loading ? T.dim : 'white', border: `1px solid ${loading ? T.border : ACCENT}`, borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', transition: 'all .15s', marginTop: 4 }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = '.9' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div style={{ marginTop: 28, padding: '16px 18px', background: T.panelAlt, border: `1px solid ${T.border}`, borderRadius: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Demo credentials</div>
            <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.8, fontFamily: 'JetBrains Mono,monospace' }}>
              admin@cctv.local<br />
              <span style={{ color: T.dim }}>password:</span> admin1234
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
