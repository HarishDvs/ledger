import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { T } from '../tokens'
import { Icon, ICONS } from '../components/Icon'
import { CAMERAS } from '../cameras'

const fmtTime  = ts  => new Date(ts * 1000).toLocaleString()
const shortHash = h  => h ? `${h.slice(0,10)}…${h.slice(-8)}` : '—'
const shortAddr = a  => a ? `${a.slice(0,6)}…${a.slice(-4)}` : '—'

function StatCard({ label, value, icon }) {
  return (
    <div style={{ background:T.panel, border:`1px solid ${T.border}`, borderRadius:8, padding:'18px 20px', boxShadow:'0 1px 2px rgba(0,0,0,.04)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <span style={{ fontSize:12, color:T.dim, textTransform:'uppercase', letterSpacing:'.06em', fontWeight:600 }}>{label}</span>
        {icon && <span style={{ color:T.dim }}>{icon}</span>}
      </div>
      <div style={{ fontSize:28, fontWeight:700, color:T.text, lineHeight:1 }}>{value ?? '—'}</div>
    </div>
  )
}

function EvidenceModal({ log, onClose, accentColor }) {
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  const timeline = [
    { time: log.timestamp - 12, label:'Camera armed',          detail:`${log.cameraId} motion threshold armed`,          color:T.dim },
    { time: log.timestamp - 4,  label:'Motion detected',       detail:'Frame buffer locked, hash calculation started',   color:T.amber },
    { time: log.timestamp,      label:'SHA-256 computed',      detail:log.videoHash,                                      color:accentColor, mono:true },
    { time: log.timestamp + 2,  label:'Transaction submitted', detail:`Uploader: ${log.uploader}`,                        color:accentColor, mono:true },
    { time: log.timestamp + 14, label:'Block confirmed',       detail:`Block #${log.blockNumber?.toLocaleString()} · Polygon Amoy`, color:T.green },
    { time: log.timestamp + 14, label:'Immutable record',      detail:'Evidence hash permanently sealed on-chain',        color:T.green },
  ]

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.35)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)' }} className="fade-in">
      <div onClick={e => e.stopPropagation()} style={{ background:T.panel, border:`1px solid ${T.border}`, borderRadius:12, width:600, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,.15)' }} className="slide-in">
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'24px 28px', borderBottom:`1px solid ${T.border}` }}>
          <div>
            <div style={{ fontSize:18, fontWeight:700, color:T.text }}>Chain of Custody</div>
            <div style={{ fontSize:13, color:T.muted, marginTop:4 }}>{log.cameraId} · Block #{log.blockNumber?.toLocaleString()}</div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:T.muted, display:'flex', padding:4, borderRadius:4 }}
            onMouseEnter={e => e.currentTarget.style.background=T.panelAlt}
            onMouseLeave={e => e.currentTarget.style.background='none'}>
            <Icon d={ICONS.close} size={20} />
          </button>
        </div>

        <div style={{ padding:'28px' }}>
          {/* Identity card */}
          <div style={{ background:T.panelAlt, border:`1px solid ${T.border}`, borderRadius:8, padding:20, marginBottom:28 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
              {[['Camera',log.cameraId],['Recorded',fmtTime(log.timestamp)],['Block',`#${log.blockNumber?.toLocaleString()}`],['Network','Polygon Amoy']].map(([l,v]) => (
                <div key={l}>
                  <div style={{ fontSize:11, color:T.dim, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4, fontWeight:600 }}>{l}</div>
                  <div style={{ fontSize:14, color:T.text, fontWeight:500 }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ paddingTop:16, borderTop:`1px solid ${T.border}` }}>
              <div style={{ fontSize:11, color:T.dim, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:6, fontWeight:600 }}>Video Hash (SHA-256)</div>
              <code style={{ display:'block', fontSize:11, color:T.text, fontFamily:'JetBrains Mono,monospace', wordBreak:'break-all', lineHeight:1.7, background:T.panel, padding:'10px 12px', borderRadius:6, border:`1px solid ${T.border}` }}>
                {log.videoHash}
              </code>
            </div>
            <div style={{ marginTop:14 }}>
              <div style={{ fontSize:11, color:T.dim, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:6, fontWeight:600 }}>Uploader Address</div>
              <code style={{ fontSize:12, color:T.muted, fontFamily:'JetBrains Mono,monospace' }}>{log.uploader || '—'}</code>
            </div>
          </div>

          {/* Timeline */}
          <div style={{ fontSize:12, fontWeight:600, color:T.muted, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:20 }}>Evidence Timeline</div>
          <div style={{ position:'relative', paddingLeft:32 }}>
            <div style={{ position:'absolute', left:7, top:8, bottom:8, width:2, background:T.border }} />
            <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
              {timeline.map((step, i) => (
                <div key={i} style={{ display:'flex', gap:16, paddingBottom: i < timeline.length-1 ? 24 : 0, position:'relative' }}>
                  <div style={{ position:'absolute', left:-32, marginTop:4 }}>
                    <div style={{ width:16, height:16, borderRadius:'50%', border:`2px solid ${step.color}`, background: i === timeline.length-1 ? step.color : T.panel }} />
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', gap:8, alignItems:'baseline' }}>
                      <div style={{ fontSize:14, fontWeight:600, color:T.text }}>{step.label}</div>
                      <div style={{ fontSize:11, color:T.dim, whiteSpace:'nowrap' }}>{new Date(step.time * 1000).toLocaleTimeString()}</div>
                    </div>
                    <div style={{ marginTop:4, fontSize:12, color:T.muted, fontFamily: step.mono ? 'JetBrains Mono,monospace' : 'inherit', wordBreak:'break-all', lineHeight:1.6 }}>
                      {step.detail}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tamper check */}
          <div style={{ marginTop:28, background:T.greenLight, border:`1px solid ${T.green}33`, borderRadius:8, padding:'16px 18px', display:'flex', alignItems:'flex-start', gap:14 }}>
            <span style={{ color:T.green, flexShrink:0 }}><Icon d={ICONS.checkCircle} size={22} /></span>
            <div>
              <div style={{ fontSize:14, fontWeight:600, color:T.green }}>Tamper-Proof Verified</div>
              <div style={{ fontSize:12, color:T.muted, marginTop:4, lineHeight:1.5 }}>Hash matches blockchain record. Evidence has not been modified since recording.</div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display:'flex', gap:10, marginTop:24 }}>
            <button onClick={() => navigator.clipboard?.writeText(log.videoHash)}
              style={{ flex:1, padding:'10px', background:T.panelAlt, border:`1px solid ${T.border}`, color:T.text, borderRadius:6, fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}
              onMouseEnter={e => e.currentTarget.style.background=T.border}
              onMouseLeave={e => e.currentTarget.style.background=T.panelAlt}>
              <Icon d={ICONS.clip} size={14} /> Copy Hash
            </button>
            <button onClick={onClose}
              style={{ flex:1, padding:'10px', background:accentColor, border:'none', color:'white', borderRadius:6, fontSize:13, fontWeight:600, cursor:'pointer' }}
              onMouseEnter={e => e.currentTarget.style.opacity='.9'}
              onMouseLeave={e => e.currentTarget.style.opacity='1'}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard({ accentColor }) {
  const [logs, setLogs]       = useState([])
  const [loading, setLoading] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [error, setError]     = useState(null)
  const [copied, setCopied]   = useState(null)
  const [search, setSearch]   = useState('')
  const [filterCam, setFilterCam] = useState('all')
  const [selected, setSelected]   = useState(null)

  const fetchLogs = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const { data } = await axios.get('/api/logs')
      setLogs(data.records || [])
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const seedData = async () => {
    setSeeding(true); setError(null)
    try {
      await axios.post('/api/seed')
      await fetchLogs()
    } catch (err) {
      setError(err.response?.data?.error || 'Seeding failed')
    } finally {
      setSeeding(false)
    }
  }

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const copy = (e, text, id) => {
    e.stopPropagation()
    navigator.clipboard?.writeText(text)
    setCopied(id); setTimeout(() => setCopied(null), 1500)
  }

  const cameras = CAMERAS.map(c => c.id)
  const filtered = logs.filter(l => {
    const q = search.toLowerCase()
    const matchQ = !q || l.videoHash?.includes(q) || l.cameraId?.toLowerCase().includes(q) || l.uploader?.toLowerCase().includes(q)
    const matchCam = filterCam === 'all' || l.cameraId === filterCam
    return matchQ && matchCam
  })
  const latestBlock = logs.length ? Math.max(...logs.map(l => l.blockNumber || 0)) : null

  return (
    <div className="fade-in">
      {selected && <EvidenceModal log={selected} onClose={() => setSelected(null)} accentColor={accentColor} />}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:700, color:T.text, letterSpacing:'-.02em' }}>Evidence Dashboard</h1>
          <p style={{ fontSize:14, color:T.muted, marginTop:4 }}>Blockchain-verified surveillance records</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {logs.length > 0 && (
            <button onClick={seedData} disabled={seeding}
              style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 16px', border:`1px solid ${accentColor}44`, borderRadius:6, background:`${accentColor}10`, color:accentColor, fontSize:13, fontWeight:600, cursor: seeding ? 'not-allowed' : 'pointer', opacity: seeding ? .6 : 1, transition:'all .1s' }}
              onMouseEnter={e => { if(!seeding) e.currentTarget.style.background=`${accentColor}20` }}
              onMouseLeave={e => { if(!seeding) e.currentTarget.style.background=`${accentColor}10` }}>
              <span className={seeding ? 'spin' : ''}><Icon d={ICONS.seed} size={16} /></span>
              {seeding ? 'Seeding…' : 'Seed Demo Data'}
            </button>
          )}
          <button onClick={fetchLogs} disabled={loading}
            style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 16px', border:`1px solid ${T.border}`, borderRadius:6, background:T.panel, color:T.text, fontSize:13, fontWeight:600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .6 : 1, boxShadow:'0 1px 2px rgba(0,0,0,.04)', transition:'all .1s' }}
            onMouseEnter={e => { if(!loading) e.currentTarget.style.background=T.panelAlt }}
            onMouseLeave={e => { if(!loading) e.currentTarget.style.background=T.panel }}>
            <span className={loading ? 'spin' : ''}><Icon d={ICONS.refresh} size={16} /></span>
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background:T.redLight, border:`1px solid ${T.red}44`, borderRadius:8, padding:'12px 16px', marginBottom:20, fontSize:13, color:T.red }}>
          {error}
        </div>
      )}

      {/* Stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:24 }}>
        <StatCard label="Total Records"   value={logs.length}                                              icon={<Icon d={ICONS.db} size={18} />} />
        <StatCard label="Latest Block"    value={latestBlock != null ? `#${latestBlock.toLocaleString()}` : '—'} icon={<Icon d={ICONS.cube} size={18} />} />
        <StatCard label="Active Cameras"  value={CAMERAS.length}                                           icon={<Icon d={ICONS.camera} size={18} />} />
      </div>

      {/* Search + filter */}
      <div style={{ display:'flex', gap:12, marginBottom:16 }}>
        <div style={{ flex:1, position:'relative' }}>
          <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:T.dim, pointerEvents:'none' }}>
            <Icon d={ICONS.search} size={16} />
          </span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by hash, camera, or address…"
            style={{ width:'100%', padding:'10px 14px 10px 40px', background:T.panel, border:`1px solid ${T.border}`, borderRadius:6, color:T.text, fontSize:14, outline:'none', boxShadow:'0 1px 2px rgba(0,0,0,.04)', transition:'all .1s' }}
            onFocus={e => { e.target.style.borderColor=accentColor; e.target.style.boxShadow=`0 0 0 3px ${accentColor}18` }}
            onBlur={e => { e.target.style.borderColor=T.border; e.target.style.boxShadow='0 1px 2px rgba(0,0,0,.04)' }} />
        </div>
        <select value={filterCam} onChange={e => setFilterCam(e.target.value)}
          style={{ padding:'10px 14px', background:T.panel, border:`1px solid ${T.border}`, borderRadius:6, color: filterCam==='all' ? T.muted : T.text, fontSize:14, cursor:'pointer', outline:'none', fontWeight:500, boxShadow:'0 1px 2px rgba(0,0,0,.04)' }}>
          <option value="all">All Cameras</option>
          {CAMERAS.map(c => <option key={c.id} value={c.id}>{c.id} — {c.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ background:T.panel, border:`1px solid ${T.border}`, borderRadius:8, overflow:'hidden', boxShadow:'0 1px 2px rgba(0,0,0,.04)' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:T.panelAlt, borderBottom:`1px solid ${T.border}` }}>
              {['Video Hash','Camera ID','Timestamp','Block Number','Uploader','Status',''].map(col => (
                <th key={col} style={{ padding:'14px 20px', textAlign:'left', fontSize:12, color:T.muted, textTransform:'uppercase', letterSpacing:'.05em', fontWeight:700 }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && logs.length === 0 ? (
              <tr><td colSpan={7} style={{ padding:'48px', textAlign:'center', color:T.dim, fontSize:14 }}>Loading records…</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={7} style={{ padding:'56px 48px', textAlign:'center' }}>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14 }}>
                  <span style={{ color:T.dim }}><Icon d={ICONS.db} size={36} /></span>
                  <div style={{ fontSize:15, fontWeight:600, color:T.text }}>No evidence records yet</div>
                  <div style={{ fontSize:13, color:T.muted, maxWidth:340 }}>Seed the dashboard with demo blockchain evidence records to explore the platform.</div>
                  <button onClick={seedData} disabled={seeding}
                    style={{ marginTop:4, padding:'10px 22px', background:accentColor, color:'white', border:'none', borderRadius:6, fontSize:13, fontWeight:600, cursor: seeding ? 'not-allowed' : 'pointer', opacity: seeding ? .7 : 1, display:'flex', alignItems:'center', gap:8, transition:'opacity .15s' }}
                    onMouseEnter={e => { if(!seeding) e.currentTarget.style.opacity='.9' }}
                    onMouseLeave={e => { e.currentTarget.style.opacity='1' }}>
                    <span className={seeding ? 'spin' : ''}><Icon d={ICONS.seed} size={14} /></span>
                    {seeding ? 'Seeding…' : 'Seed Demo Data'}
                  </button>
                </div>
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ padding:'48px', textAlign:'center', color:T.dim, fontSize:14 }}>No records match your search.</td></tr>
            ) : filtered.map((log, i) => (
              <tr key={log.videoHash || i}
                onClick={() => setSelected(log)}
                style={{ borderBottom: i < filtered.length-1 ? `1px solid ${T.border}` : 'none', background:T.panel, transition:'background .1s', cursor:'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background=T.panelAlt}
                onMouseLeave={e => e.currentTarget.style.background=T.panel}>
                <td style={{ padding:'14px 20px', whiteSpace:'nowrap' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <code style={{ fontSize:13, color:T.text, background:T.panelAlt, padding:'4px 10px', borderRadius:4, fontFamily:'JetBrains Mono,monospace', fontWeight:500 }}>
                      {shortHash(log.videoHash)}
                    </code>
                    <button onClick={e => copy(e, log.videoHash, log.videoHash)}
                      style={{ background:'none', border:'none', cursor:'pointer', color: copied===log.videoHash ? T.green : T.dim, display:'flex', padding:4, borderRadius:4 }}
                      onMouseEnter={e => e.currentTarget.style.background=T.panelAlt}
                      onMouseLeave={e => e.currentTarget.style.background='none'}>
                      <Icon d={ICONS.clip} size={14} />
                    </button>
                  </div>
                </td>
                <td style={{ padding:'14px 20px', whiteSpace:'nowrap' }}>
                  <span style={{ fontSize:12, fontWeight:600, color:accentColor, background:T.blueLight, padding:'3px 10px', borderRadius:4 }}>{log.cameraId}</span>
                </td>
                <td style={{ padding:'14px 20px', fontSize:13, color:T.muted, fontWeight:500 }}>{fmtTime(log.timestamp)}</td>
                <td style={{ padding:'14px 20px' }}>
                  <code style={{ fontSize:12, color:T.muted, background:T.panelAlt, padding:'4px 8px', borderRadius:4, fontFamily:'JetBrains Mono,monospace', fontWeight:500 }}>
                    #{log.blockNumber?.toLocaleString() || '—'}
                  </code>
                </td>
                <td style={{ padding:'14px 20px' }}>
                  <code style={{ fontSize:12, color:T.muted, fontFamily:'JetBrains Mono,monospace' }}>{shortAddr(log.uploader)}</code>
                </td>
                <td style={{ padding:'14px 20px', whiteSpace:'nowrap' }}>
                  <span style={{
                    fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:4,
                    letterSpacing:'.05em', textTransform:'uppercase',
                    background: log.status === 'confirmed' ? T.greenLight : log.status === 'failed' ? T.redLight : T.amberLight,
                    color: log.status === 'confirmed' ? T.green : log.status === 'failed' ? T.red : T.amber,
                  }}>
                    {log.status || 'pending'}
                  </span>
                </td>
                <td style={{ padding:'14px 20px', textAlign:'right' }}>
                  <span style={{ color:T.dim, opacity:.4, display:'flex', justifyContent:'flex-end' }}><Icon d={ICONS.eye} size={16} /></span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop:12, fontSize:13, color:T.muted, fontWeight:500 }}>
        {filtered.length} of {logs.length} records · click any row to view chain of custody
      </div>
    </div>
  )
}
