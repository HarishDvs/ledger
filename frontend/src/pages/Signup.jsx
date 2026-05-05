import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { T } from '../tokens'
import { Icon, ICONS } from '../components/Icon'

const ACCENT = '#2563eb'

const ROLES = [
  { value: 'analyst',  label: 'Analyst',          desc: 'View and analyse evidence records'        },
  { value: 'officer',  label: 'Officer',           desc: 'Record and verify evidence in the field'  },
  { value: 'admin',    label: 'Administrator',     desc: 'Full system access and user management'   },
]

export default function Signup() {
  const { register } = useAuth()
  const navigate     = useNavigate()

  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [role, setRole]         = useState('analyst')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)

  const submit = async e => {
    e.preventDefault()
    if (!name || !email || !password) { setError('All fields are required'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    if (password !== confirm) { setError('Passwords do not match'); return }
    setLoading(true); setError(null)
    try {
      await register(name.trim(), email.trim(), password, role)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fieldStyle = (focused) => ({
    display: 'block', width: '100%', padding: '10px 14px',
    background: T.panel, border: `1px solid ${T.border}`,
    borderRadius: 8, color: T.text, fontSize: 14, outline: 'none',
    transition: 'border-color .15s, box-shadow .15s',
  })

  const focusProps = {
    onFocus: e => { e.target.style.borderColor = ACCENT; e.target.style.boxShadow = `0 0 0 3px ${ACCENT}18` },
    onBlur:  e => { e.target.style.borderColor = T.border; e.target.style.boxShadow = 'none' },
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: T.base }}>
      {/* ── Left branding panel ── */}
      <div style={{ width: 420, flexShrink: 0, background: '#0f172a', display: 'flex', flexDirection: 'column', padding: '52px 44px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: .04, backgroundImage: 'radial-gradient(circle at 1px 1px, #60a5fa 1px, transparent 0)', backgroundSize: '32px 32px', pointerEvents: 'none' }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 52, position: 'relative' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: `${ACCENT}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${ACCENT}40` }}>
            <Icon d={ICONS.shield} size={22} style={{ color: '#60a5fa' }} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>CCTV Integrity</div>
            <div style={{ fontSize: 11, color: '#64748b', letterSpacing: '.04em', marginTop: 1 }}>Evidence Platform</div>
          </div>
        </div>

        <div style={{ position: 'relative', flex: 1 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#f1f5f9', lineHeight: 1.2, marginBottom: 14 }}>
            Join your department's evidence platform
          </div>
          <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.7, marginBottom: 36, maxWidth: 320 }}>
            Create your account to start recording, verifying, and managing blockchain-sealed surveillance evidence.
          </p>

          {/* Role descriptions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4 }}>Access roles</div>
            {ROLES.map(r => (
              <div key={r.value} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 22, height: 22, borderRadius: 5, background: `${ACCENT}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                  <Icon d={ICONS.user} size={11} style={{ color: '#60a5fa' }} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1' }}>{r.label}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, lineHeight: 1.4 }}>{r.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 32px', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: T.text, letterSpacing: '-.02em' }}>Create your account</h1>
            <p style={{ fontSize: 14, color: T.muted, marginTop: 8 }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: ACCENT, fontWeight: 600, textDecoration: 'none' }}
                onMouseEnter={e => e.target.style.textDecoration='underline'}
                onMouseLeave={e => e.target.style.textDecoration='none'}>
                Sign in
              </Link>
            </p>
          </div>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Full name */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 6, letterSpacing: '.02em' }}>Full name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Detective Jane Smith" autoComplete="name" autoFocus
                style={fieldStyle()} {...focusProps} />
            </div>

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 6, letterSpacing: '.02em' }}>Email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="officer@department.gov" autoComplete="email"
                style={fieldStyle()} {...focusProps} />
            </div>

            {/* Role */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 6, letterSpacing: '.02em' }}>Role</label>
              <select value={role} onChange={e => setRole(e.target.value)}
                style={{ ...fieldStyle(), cursor: 'pointer', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: 16, paddingRight: 36 }}>
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 6, letterSpacing: '.02em' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 8 characters" autoComplete="new-password"
                  style={{ ...fieldStyle(), paddingRight: 44 }} {...focusProps} />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: T.dim, display: 'flex', padding: 4 }}>
                  <Icon d={ICONS.eye} size={16} />
                </button>
              </div>
              {password && (
                <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: password.length >= i * 3 ? (i <= 2 ? T.amber : T.green) : T.border, transition: 'background .3s' }} />
                  ))}
                </div>
              )}
            </div>

            {/* Confirm */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 6, letterSpacing: '.02em' }}>Confirm password</label>
              <input type={showPw ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)}
                placeholder="••••••••" autoComplete="new-password"
                style={{ ...fieldStyle(), borderColor: confirm && confirm !== password ? T.red : T.border }}
                {...focusProps} />
              {confirm && confirm !== password && (
                <div style={{ fontSize: 11, color: T.red, marginTop: 5 }}>Passwords do not match</div>
              )}
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
              onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity='.9' }}
              onMouseLeave={e => { e.currentTarget.style.opacity='1' }}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
