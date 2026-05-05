import { useState, useEffect, useCallback } from 'react'
import { T } from '../tokens'
import { Icon, ICONS } from '../components/Icon'
import { CAMERAS } from '../cameras'

function MjpegFeed({ cam, onStatusChange }) {
  const [status, setStatus] = useState('loading')
  const [retryKey, setRetryKey] = useState(0)
  const [retryIn, setRetryIn] = useState(0)

  useEffect(() => {
    if (status !== 'error') return
    setRetryIn(20)
    const countdown = setInterval(() => setRetryIn(n => Math.max(0, n - 1)), 1000)
    const retry = setTimeout(() => {
      clearInterval(countdown)
      setRetryKey(k => k + 1)
      setStatus('loading')
    }, 20000)
    return () => { clearInterval(countdown); clearTimeout(retry) }
  }, [status, retryKey])

  useEffect(() => {
    onStatusChange?.(cam.id, status)
  }, [cam.id, status, onStatusChange])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {status !== 'error' && (
        <img
          key={retryKey}
          src={cam.streamUrl}
          onLoad={() => setStatus('live')}
          onError={() => setStatus('error')}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block',
            ...(cam.maskRight && { maskImage: 'linear-gradient(90deg, black 55%, transparent 75%)', WebkitMaskImage: 'linear-gradient(90deg, black 55%, transparent 75%)' })
          }}
          alt=""
          referrerPolicy="no-referrer"
        />
      )}

      {status === 'error' && (
        <div style={{
          width: '100%', height: '100%',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'repeating-linear-gradient(0deg,rgba(255,255,255,.015) 0px,rgba(255,255,255,.015) 1px,transparent 1px,transparent 4px)',
          color: 'rgba(255,255,255,.25)',
        }}>
          <Icon d={ICONS.camera} size={26} />
          <div style={{ fontSize: 11, marginTop: 10, letterSpacing: '.14em', fontWeight: 700 }}>SIGNAL LOST</div>
          <div style={{ fontSize: 9, marginTop: 6, color: 'rgba(255,255,255,.15)', letterSpacing: '.06em' }}>
            Reconnecting in {retryIn}s…
          </div>
        </div>
      )}

      {status === 'loading' && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(5,11,20,.88)',
        }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', letterSpacing: '.12em' }}>CONNECTING…</div>
        </div>
      )}

      {/* Subtle scanline overlay on live stream */}
      {status === 'live' && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'repeating-linear-gradient(0deg,transparent 0px,transparent 2px,rgba(0,0,0,.07) 2px,rgba(0,0,0,.07) 3px)',
        }} />
      )}

      {/* LIVE badge — only when streaming */}
      {status === 'live' && (
        <div style={{
          position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(239,68,68,.85)', color: 'white',
          fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 3, letterSpacing: '.1em',
          pointerEvents: 'none',
        }}>
          LIVE
        </div>
      )}
    </div>
  )
}

function YoutubeFeed({ cam }) {
  const src = `https://www.youtube.com/embed/${cam.youtubeId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${cam.youtubeId}&rel=0&modestbranding=1&iv_load_policy=3`
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <iframe
        src={src}
        allow="autoplay; encrypted-media"
        allowFullScreen
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
        title={cam.label}
      />
      {/* Scanline overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'repeating-linear-gradient(0deg,transparent 0px,transparent 2px,rgba(0,0,0,.05) 2px,rgba(0,0,0,.05) 3px)',
      }} />
      {/* LIVE badge */}
      <div style={{
        position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(239,68,68,.85)', color: 'white',
        fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 3, letterSpacing: '.1em',
        pointerEvents: 'none',
      }}>
        LIVE
      </div>
    </div>
  )
}

function CameraFeed({ cam, accentColor, onClick, onStatusChange }) {
  const [, tick] = useState(0)

  useEffect(() => {
    const iv = setInterval(() => tick(t => t + 1), 1000)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    if (cam.type === 'youtube') onStatusChange?.(cam.id, 'live')
  }, [cam.id, cam.type, onStatusChange])

  const now = new Date()
  const timeStr = now.toTimeString().slice(0, 8)
  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        borderRadius: 8,
        overflow: 'hidden',
        cursor: 'pointer',
        aspectRatio: '16/9',
        background: '#050b14',
        border: `1px solid ${cam.motion ? 'rgba(239,68,68,.4)' : T.border}`,
        boxShadow: cam.motion ? '0 0 14px rgba(239,68,68,.15)' : 'none',
        transition: 'border-color .2s, transform .15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'scale(1.01)'
        e.currentTarget.style.borderColor = accentColor
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'scale(1)'
        e.currentTarget.style.borderColor = cam.motion ? 'rgba(239,68,68,.4)' : T.border
      }}
    >
      {/* ── Stream renderer ── */}
      {cam.type === 'youtube'
        ? <YoutubeFeed cam={cam} />
        : <MjpegFeed cam={cam} onStatusChange={onStatusChange} />
      }

      {/* ── HUD: Camera ID top-left ── */}
      <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', alignItems: 'center', gap: 5, pointerEvents: 'none' }}>
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          background: cam.motion ? '#ef4444' : '#22c55e',
          boxShadow: `0 0 5px ${cam.motion ? '#ef4444' : '#22c55e'}`,
        }} className="pulse" />
        <span style={{
          fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.9)',
          background: 'rgba(0,0,0,.6)', padding: '2px 7px', borderRadius: 4,
          letterSpacing: '.06em', fontFamily: 'JetBrains Mono,monospace',
        }}>
          {cam.id}
        </span>
      </div>

      {/* ── HUD: REC top-right ── */}
      <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', alignItems: 'center', gap: 4, pointerEvents: 'none' }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444' }} className="pulse" />
        <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,.7)', letterSpacing: '.1em' }}>REC</span>
      </div>

      {/* ── HUD: Bottom bar ── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'linear-gradient(transparent, rgba(0,0,0,.8))',
        padding: '18px 10px 6px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        pointerEvents: 'none',
      }}>
        <div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,.8)', fontWeight: 600 }}>{cam.label}</div>
          <div style={{ fontSize: 8, color: 'rgba(255,255,255,.4)', letterSpacing: '.04em', marginTop: 1 }}>{cam.location}</div>
        </div>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,.5)', fontFamily: 'JetBrains Mono,monospace', whiteSpace: 'nowrap' }}>
          {dateStr} {timeStr}
        </span>
      </div>

      {/* ── HUD: Motion badge ── */}
      {cam.motion && (
        <div style={{
          position: 'absolute', bottom: 36, right: 8, pointerEvents: 'none',
          background: 'rgba(239,68,68,.85)', color: 'white',
          fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4, letterSpacing: '.08em',
        }}>
          MOTION
        </div>
      )}
    </div>
  )
}

export default function LiveMonitor({ accentColor }) {
  const [focusCam, setFocusCam] = useState(null)
  const [layout, setLayout] = useState('2x3')
  const cols = layout === '2x3' ? 3 : layout === '2x2' ? 2 : 1
  const [cameraStatuses, setCameraStatuses] = useState(() =>
    Object.fromEntries(CAMERAS.map(c => [c.id, 'loading']))
  )
  const handleStatusChange = useCallback((id, status) => {
    setCameraStatuses(prev => ({ ...prev, [id]: status }))
  }, [])

  const statusValues = Object.values(cameraStatuses)
  const liveCams       = statusValues.filter(s => s === 'live').length
  const connectingCams = statusValues.filter(s => s === 'loading').length
  const offlineCams    = statusValues.filter(s => s === 'error').length

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px)', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text }}>Live Monitor</h1>
          <div style={{ fontSize: 11, color: T.dim, marginTop: 2, display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ color: T.green, fontWeight: 600 }}>{liveCams} live</span>
            <span>·</span>
            <span>{connectingCams} connecting</span>
            <span>·</span>
            <span style={{ color: offlineCams > 0 ? T.red : T.dim, fontWeight: offlineCams > 0 ? 600 : 400 }}>{offlineCams} offline</span>
            <span>·</span>
            <span>{CAMERAS.filter(c => c.motion).length} motion active</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['1x1', '2x2', '2x3'].map(l => (
            <button key={l} onClick={() => { setLayout(l); setFocusCam(null) }}
              style={{
                padding: '5px 12px', borderRadius: 6,
                border: `1px solid ${layout === l ? accentColor : T.border}`,
                background: layout === l ? `${accentColor}20` : 'transparent',
                color: layout === l ? accentColor : T.dim,
                fontSize: 11, cursor: 'pointer', fontWeight: 500,
              }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {focusCam ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button onClick={() => setFocusCam(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, width: 'fit-content' }}>
            ← Back to grid
          </button>
          <div style={{ flex: 1, maxHeight: 'calc(100vh - 160px)' }}>
            <CameraFeed cam={focusCam} accentColor={accentColor} onStatusChange={handleStatusChange} onClick={() => {}} />
          </div>
          <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8, padding: '12px 16px', display: 'flex', gap: 32, flexShrink: 0 }}>
            {[
              ['Camera', focusCam.id],
              ['Location', `${focusCam.label} · ${focusCam.location}`],
              ['Zone', focusCam.zone],
              ['Status', focusCam.motion ? 'MOTION DETECTED' : 'Clear'],
            ].map(([l, v]) => (
              <div key={l}>
                <div style={{ fontSize: 10, color: T.dim, textTransform: 'uppercase', letterSpacing: '.07em' }}>{l}</div>
                <div style={{ fontSize: 13, color: l === 'Status' && focusCam.motion ? T.red : T.text, fontWeight: 500, marginTop: 2 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: `repeat(${cols},1fr)`, gap: 10, alignContent: 'start', overflowY: 'auto' }}>
          {CAMERAS.map(cam => (
            <CameraFeed key={cam.id} cam={cam} accentColor={accentColor}
              onStatusChange={handleStatusChange}
              onClick={() => { setFocusCam(cam); setLayout('1x1') }} />
          ))}
        </div>
      )}
    </div>
  )
}
