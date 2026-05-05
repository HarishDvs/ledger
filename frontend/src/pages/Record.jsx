import { useState, useRef } from 'react'
import axios from 'axios'
import { T } from '../tokens'
import { Icon, ICONS } from '../components/Icon'

const fmtTime = ts => new Date(ts * 1000).toLocaleString()

async function calcHash(file) {
  const buf = await file.arrayBuffer()
  const hashBuf = await crypto.subtle.digest('SHA-256', buf)
  const hex = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2,'0')).join('')
  return '0x' + hex
}

export default function Record({ accentColor }) {
  const [file, setFile]       = useState(null)
  const [cameraId, setCameraId] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState(null)
  const [error, setError]     = useState(null)
  const [hash, setHash]       = useState(null)
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef()

  const processFile = async f => {
    setFile(f); setResult(null); setError(null)
    try { setHash(await calcHash(f)) } catch {}
  }

  const submit = async e => {
    e.preventDefault()
    if (!file)            { setError('Please select a video file'); return }
    if (!cameraId.trim()) { setError('Please enter a Camera ID'); return }
    setLoading(true); setError(null)
    try {
      const fd = new FormData()
      fd.append('video', file)
      fd.append('cameraId', cameraId.trim())
      const { data } = await axios.post('/api/record', fd, { headers:{ 'Content-Type':'multipart/form-data' } })
      setResult(data)
      setFile(null); setCameraId(''); setHash(null)
      if (fileRef.current) fileRef.current.value = ''
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }

  const dropBorder = dragging ? accentColor : file ? T.green : T.border
  const dropBg     = dragging ? `${accentColor}10` : file ? `${T.green}08` : T.panel

  return (
    <div className="fade-in" style={{ maxWidth:600 }}>
      <h1 style={{ fontSize:22, fontWeight:700, color:T.text, marginBottom:24 }}>Record Evidence</h1>

      <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
        {/* Drop zone */}
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={e => { e.preventDefault(); setDragging(false) }}
          onDrop={e => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]) }}
          style={{ border:`2px dashed ${dropBorder}`, borderRadius:10, padding:'40px 20px', textAlign:'center', cursor:'pointer', background:dropBg, transition:'all .2s' }}>
          <input type="file" ref={fileRef} onChange={e => e.target.files[0] && processFile(e.target.files[0])} accept="video/*,.mp4,.avi,.mov,.mkv" style={{ display:'none' }} />
          {file ? (
            <>
              <div style={{ color:T.green, marginBottom:8, display:'flex', justifyContent:'center' }}><Icon d={ICONS.checkCircle} size={40} stroke={1} /></div>
              <div style={{ fontSize:14, fontWeight:500, color:T.text }}>{file.name}</div>
              <div style={{ fontSize:12, color:T.dim, marginTop:4 }}>{(file.size/1024/1024).toFixed(2)} MB</div>
            </>
          ) : (
            <>
              <div style={{ color:T.dim, marginBottom:8, display:'flex', justifyContent:'center' }}><Icon d={ICONS.upload} size={40} stroke={1} /></div>
              <div style={{ fontSize:13, color:T.muted }}>
                <span style={{ color:accentColor, fontWeight:600 }}>Click to upload</span> or drag and drop
              </div>
              <div style={{ fontSize:11, color:T.dim, marginTop:4 }}>MP4, AVI, MOV, MKV</div>
            </>
          )}
        </div>

        {/* Hash preview */}
        {hash && (
          <div style={{ background:T.panelAlt, border:`1px solid ${T.border}`, borderRadius:8, padding:'12px 14px' }} className="slide-in">
            <div style={{ fontSize:11, color:T.dim, marginBottom:6 }}>
              SHA-256 Hash <span style={{ color:T.border }}>· calculated locally</span>
            </div>
            <code style={{ fontSize:11, color:T.muted, fontFamily:'JetBrains Mono,monospace', wordBreak:'break-all', lineHeight:1.6 }}>{hash}</code>
          </div>
        )}

        {/* Camera ID */}
        <div>
          <label style={{ display:'block', fontSize:12, fontWeight:500, color:T.muted, marginBottom:6 }}>Camera ID</label>
          <input type="text" value={cameraId} onChange={e => setCameraId(e.target.value)}
            placeholder="e.g. CAM-001, Entrance-North"
            style={{ display:'block', width:'100%', padding:'10px 12px', background:T.panel, border:`1px solid ${T.border}`, borderRadius:7, color:T.text, fontSize:13, outline:'none', transition:'border-color .15s' }}
            onFocus={e => e.target.style.borderColor=accentColor}
            onBlur={e => e.target.style.borderColor=T.border} />
        </div>

        {error && (
          <div style={{ background:T.redLight, border:`1px solid ${T.red}44`, color:T.red, padding:'10px 14px', borderRadius:7, fontSize:13 }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={loading || !file || !cameraId.trim()}
          style={{ padding:'11px', background: loading || !file || !cameraId.trim() ? T.panelAlt : accentColor, color: loading || !file || !cameraId.trim() ? T.dim : 'white', border:`1px solid ${loading || !file || !cameraId.trim() ? T.border : accentColor}`, borderRadius:7, fontSize:13, fontWeight:600, cursor: loading || !file || !cameraId.trim() ? 'not-allowed' : 'pointer', transition:'all .15s' }}>
          {loading ? 'Recording to Blockchain…' : 'Record Evidence'}
        </button>
      </form>

      {result && (
        <div className="slide-in" style={{ marginTop:24, background:T.panel, border:`2px solid ${T.green}`, borderRadius:10, padding:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
            <span style={{ color:T.green }}><Icon d={ICONS.checkCircle} size={22} /></span>
            <span style={{ fontSize:15, fontWeight:600, color:T.green }}>Evidence Recorded Successfully</span>
          </div>
          {[
            ['Video Hash',    <code style={{ fontSize:11, fontFamily:'JetBrains Mono,monospace', wordBreak:'break-all', color:T.text }}>{result.videoHash}</code>],
            ['Transaction',   <code style={{ fontSize:11, fontFamily:'JetBrains Mono,monospace', wordBreak:'break-all', color:T.text }}>{result.txHash}</code>],
            ['Block Number',  `#${result.blockNumber?.toLocaleString()}`],
            ['Camera ID',     result.cameraId],
            ['Timestamp',     fmtTime(result.timestamp)],
          ].map(([label, val]) => (
            <div key={label} style={{ display:'flex', flexDirection:'column', gap:3, marginBottom:12, borderBottom:`1px solid ${T.border}`, paddingBottom:12 }}>
              <dt style={{ fontSize:10, color:T.dim, textTransform:'uppercase', letterSpacing:'.08em', fontWeight:600 }}>{label}</dt>
              <dd style={{ fontSize:13, color:T.text }}>{val}</dd>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
