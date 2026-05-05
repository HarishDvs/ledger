import { useState, useEffect, useRef } from 'react'
import { T } from '../tokens'
import { Icon, ICONS } from '../components/Icon'

function StatCard({ label, value }) {
  return (
    <div style={{ background:T.panel, border:`1px solid ${T.border}`, borderRadius:8, padding:'14px 16px', boxShadow:'0 1px 2px rgba(0,0,0,.04)' }}>
      <div style={{ fontSize:11, color:T.dim, textTransform:'uppercase', letterSpacing:'.06em', fontWeight:600, marginBottom:8 }}>{label}</div>
      <div style={{ fontSize:22, fontWeight:700, color:T.text, lineHeight:1 }}>{value ?? '—'}</div>
    </div>
  )
}

const alertStyle = type => {
  if (type === 'violence') return { border:T.red,   text:T.red,   bar:T.red,   badge:T.redLight,   badgeBorder:`${T.red}44`,   badgeText:T.red   }
  if (type === 'anomaly')  return { border:T.amber, text:T.amber, bar:T.amber, badge:T.amberLight, badgeBorder:`${T.amber}44`, badgeText:T.amber }
  return                          { border:T.blue,  text:T.blue,  bar:T.blue,  badge:T.blueLight,  badgeBorder:`${T.blue}44`,  badgeText:T.blue  }
}

const AI_BASE = 'http://localhost:8000'

export default function Alerts({ alerts, clearAlerts, isConnected, accentColor }) {
  const [aiStatus, setAiStatus] = useState(null)
  const [loading, setLoading]   = useState(false)

  const fetchStatus = async () => {
    try {
      const r = await fetch(`${AI_BASE}/api/ai/status`)
      if (r.ok) setAiStatus(await r.json())
    } catch {}
  }

  useEffect(() => {
    fetchStatus()
    const iv = setInterval(fetchStatus, 5000)
    return () => clearInterval(iv)
  }, [])

  const startDetection = async () => {
    setLoading(true)
    try {
      const r = await fetch(`${AI_BASE}/api/ai/start`, { method:'POST', headers:{ 'Content-Type':'application/json' } })
      if (r.ok) fetchStatus()
    } catch {}
    setLoading(false)
  }

  const stopDetection = async () => {
    setLoading(true)
    try {
      const r = await fetch(`${AI_BASE}/api/ai/stop`, { method:'POST' })
      if (r.ok) fetchStatus()
    } catch {}
    setLoading(false)
  }

  const triggerTest = async () => {
    try {
      const r = await fetch(`${AI_BASE}/api/ai/trigger-test`, { method:'POST' })
      const data = await r.json()
      console.log('Test trigger:', data)
    } catch (err) {
      console.error('Failed to trigger test:', err)
    }
  }

  const detecting = aiStatus?.is_detecting ?? false

  return (
    <div className="fade-in" style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <h1 style={{ fontSize:22, fontWeight:700, color:T.text }}>AI Crime Detection</h1>

      {/* Status panel */}
      <div style={{ background:T.panel, border:`1px solid ${T.border}`, borderRadius:10, padding:20 }}>
        <div style={{ fontSize:11, fontWeight:600, color:T.dim, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:14 }}>Detection Status</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16 }}>
          <StatCard label="Status" value={
            <span style={{ color: detecting ? T.green : T.muted, fontSize:16 }}>{detecting ? 'Detecting' : 'Stopped'}</span>
          } />
          <StatCard label="Camera"  value={aiStatus?.camera_id      ?? '—'} />
          <StatCard label="Buffer"  value={aiStatus ? `${aiStatus.buffer_duration?.toFixed(1)}s` : '—'} />
          <StatCard label="FPS"     value={aiStatus ? aiStatus.fps?.toFixed(1) : '—'} />
        </div>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <button onClick={startDetection} disabled={loading || detecting}
            style={{ padding:'8px 16px', background: detecting ? T.panelAlt : T.green, border:`1px solid ${detecting ? T.border : T.green}`, color: detecting ? T.dim : 'white', borderRadius:7, fontSize:12, fontWeight:600, cursor: detecting ? 'not-allowed' : 'pointer', opacity: detecting ? .5 : 1, transition:'all .15s' }}>
            Start Detection
          </button>
          <button onClick={stopDetection} disabled={loading || !detecting}
            style={{ padding:'8px 16px', background:'transparent', border:`1px solid ${!detecting ? T.border : T.red}44`, color: !detecting ? T.dim : T.red, borderRadius:7, fontSize:12, fontWeight:600, cursor: !detecting ? 'not-allowed' : 'pointer', opacity: !detecting ? .4 : 1, transition:'all .15s' }}>
            Stop Detection
          </button>
          <button onClick={triggerTest}
            style={{ padding:'8px 16px', background:'transparent', border:`1px solid ${accentColor}55`, color:accentColor, borderRadius:7, fontSize:12, fontWeight:600, cursor:'pointer' }}>
            Trigger Test
          </button>
        </div>
      </div>

      {/* Alert feed */}
      <div style={{ background:T.panel, border:`1px solid ${T.border}`, borderRadius:10, padding:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <div style={{ fontSize:11, fontWeight:600, color:T.dim, textTransform:'uppercase', letterSpacing:'.08em' }}>
            Real-time Alerts {alerts.length > 0 && <span style={{ color:T.muted }}>· {alerts.length}</span>}
          </div>
          {alerts.length > 0 && (
            <button onClick={clearAlerts} style={{ background:'none', border:'none', cursor:'pointer', fontSize:11, color:T.dim }}>
              Clear All
            </button>
          )}
        </div>

        {alerts.length === 0 ? (
          <div style={{ textAlign:'center', padding:'40px 0' }}>
            <div style={{ color:T.border, display:'flex', justifyContent:'center', marginBottom:12 }}><Icon d={ICONS.camera} size={36} /></div>
            <div style={{ fontSize:13, color:T.dim }}>No alerts yet.</div>
            <div style={{ fontSize:11, color:T.dim, marginTop:4 }}>Start detection to begin monitoring for incidents.</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10, maxHeight:420, overflowY:'auto', paddingRight:4 }}>
            {alerts.map((alert, idx) => {
              const c = alertStyle(alert.type)
              const pct = ((alert.confidence ?? 0) * 100).toFixed(0)
              return (
                <div key={`${alert.timestamp}-${idx}`} className="slide-in"
                  style={{ background:T.base, borderLeft:`3px solid ${c.border}`, borderRadius:'0 8px 8px 0', padding:'12px 14px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', gap:12 }}>
                    <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                      <span style={{ color:c.text, marginTop:1 }}>
                        <Icon d={alert.type === 'recording' ? ICONS.video : ICONS.warn} size={15} />
                      </span>
                      <div>
                        <span style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:c.badgeText, background:c.badge, border:`1px solid ${c.badgeBorder}`, padding:'1px 7px', borderRadius:4 }}>
                          {alert.type}
                        </span>
                        <div style={{ fontSize:13, color:T.text, marginTop:5 }}>{alert.message}</div>
                        {alert.camera_id && <div style={{ fontSize:11, color:T.dim, marginTop:2 }}>{alert.camera_id}</div>}
                      </div>
                    </div>
                    <span style={{ fontSize:10, color:T.dim, flexShrink:0, marginTop:2 }}>
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div style={{ marginTop:10 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:T.dim, marginBottom:4 }}>
                      <span>Confidence</span><span>{pct}%</span>
                    </div>
                    <div style={{ height:3, background:T.panelAlt, borderRadius:2, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${pct}%`, background:c.bar, borderRadius:2, transition:'width .5s' }} />
                    </div>
                  </div>
                  {alert.data?.videoHash && (
                    <div style={{ marginTop:8, fontSize:10, fontFamily:'JetBrains Mono,monospace', background:T.panel, padding:'6px 10px', borderRadius:5, color:T.muted, border:`1px solid ${T.border}` }}>
                      <span style={{ color:T.dim }}>hash: </span>{alert.data.videoHash.slice(0,24)}…
                      {alert.data.transactionHash && <span style={{ marginLeft:12 }}><span style={{ color:T.dim }}>tx: </span>{alert.data.transactionHash.slice(0,16)}…</span>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Setup guide */}
      <div style={{ background:T.panel, border:`1px solid ${T.border}`, borderRadius:10, padding:'14px 18px', fontSize:12, color:T.muted }}>
        <div style={{ fontWeight:600, color:T.text, marginBottom:8 }}>Setup Guide</div>
        <ul style={{ paddingLeft:16, display:'flex', flexDirection:'column', gap:5 }}>
          <li>Start AI service: <code style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11, background:T.panelAlt, padding:'1px 6px', borderRadius:4, color:T.text }}>cd ai-service && python -m app.main</code></li>
          <li>Click "Start Detection" to begin webcam monitoring</li>
          <li>Violence/anomaly events are automatically hashed &amp; written to blockchain</li>
          <li>Alerts stream here in real-time via WebSocket</li>
        </ul>
      </div>
    </div>
  )
}
