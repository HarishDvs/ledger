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

export default function Verify({ accentColor }) {
  const [file, setFile]       = useState(null)
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

  const verify = async () => {
    if (!file) { setError('Please select a file first'); return }
    setLoading(true); setError(null)
    try {
      const fd = new FormData()
      fd.append('video', file)
      const { data } = await axios.post('/api/verify', fd, { headers:{ 'Content-Type':'multipart/form-data' } })
      setResult(data)
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setFile(null); setHash(null); setResult(null); setError(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const dropBorder = result ? (result.verified ? T.green : T.red) : dragging ? accentColor : file ? T.muted : T.border

  return (
    <div className="fade-in" style={{ maxWidth:600 }}>
      <h1 style={{ fontSize:22, fontWeight:700, color:T.text, marginBottom:24 }}>Verify Evidence</h1>

      {/* Drop zone */}
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={e => { e.preventDefault(); setDragging(false) }}
        onDrop={e => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]) }}
        style={{ border:`2px dashed ${dropBorder}`, borderRadius:10, padding:'48px 24px', textAlign:'center', cursor:'pointer', background:T.panel, transition:'all .2s' }}>
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
            <div style={{ fontSize:11, color:T.dim, marginTop:4 }}>Any video file to verify against blockchain</div>
          </>
        )}
      </div>

      {hash && (
        <div style={{ background:T.panelAlt, border:`1px solid ${T.border}`, borderRadius:8, padding:'12px 14px', marginTop:14 }} className="slide-in">
          <div style={{ fontSize:11, color:T.dim, marginBottom:6 }}>SHA-256 Hash <span style={{ color:T.border }}>· calculated locally</span></div>
          <code style={{ fontSize:11, color:T.muted, fontFamily:'JetBrains Mono,monospace', wordBreak:'break-all', lineHeight:1.6 }}>{hash}</code>
        </div>
      )}

      {error && (
        <div style={{ background:T.redLight, border:`1px solid ${T.red}44`, color:T.red, padding:'10px 14px', borderRadius:7, fontSize:13, marginTop:14 }}>
          {error}
        </div>
      )}

      <div style={{ display:'flex', gap:10, marginTop:16 }}>
        <button onClick={verify} disabled={loading || !file}
          style={{ flex:1, padding:'11px', background: loading || !file ? T.panelAlt : accentColor, color: loading || !file ? T.dim : 'white', border:`1px solid ${loading || !file ? T.border : accentColor}`, borderRadius:7, fontSize:13, fontWeight:600, cursor: loading || !file ? 'not-allowed' : 'pointer', transition:'all .15s' }}>
          {loading ? 'Verifying on Chain…' : 'Verify on Blockchain'}
        </button>
        <button onClick={reset}
          style={{ padding:'11px 18px', background:'transparent', border:`1px solid ${T.border}`, color:T.muted, borderRadius:7, fontSize:13, fontWeight:600, cursor:'pointer', transition:'all .15s' }}
          onMouseEnter={e => { e.currentTarget.style.background=T.panelAlt; e.currentTarget.style.color=T.text }}
          onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color=T.muted }}>
          Reset
        </button>
      </div>

      {result && (
        <div className="slide-in" style={{ marginTop:20, background:T.panel, border:`2px solid ${result.verified ? T.green : T.red}`, borderRadius:10, padding:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
            <span style={{ color: result.verified ? T.green : T.red }}>
              <Icon d={result.verified ? ICONS.checkCircle : ICONS.xCircle} size={32} stroke={1} />
            </span>
            <div>
              <div style={{ fontSize:18, fontWeight:700, color: result.verified ? T.green : T.red, letterSpacing:'.04em' }}>
                {result.verified ? 'VERIFIED' : 'NOT FOUND'}
              </div>
              <div style={{ fontSize:12, color:T.muted }}>
                {result.verified ? 'Evidence confirmed on blockchain' : (result.message || 'Evidence not found on blockchain')}
              </div>
            </div>
          </div>

          {result.verified && result.evidence && (
            <div style={{ borderTop:`1px solid ${T.border}`, paddingTop:14, display:'flex', flexDirection:'column', gap:10 }}>
              {[
                ['Camera ID',    result.evidence.cameraId],
                ['Recorded At',  fmtTime(result.evidence.timestamp)],
                ['Block',        `#${result.evidence.blockNumber?.toLocaleString()}`],
                ['Uploader',     <code style={{ fontSize:11, fontFamily:'JetBrains Mono,monospace', color:T.text }}>{result.evidence.uploader}</code>],
                ['Source',       result.source],
              ].map(([l, v]) => (
                <div key={l} style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                  <dt style={{ fontSize:11, color:T.dim, textTransform:'uppercase', letterSpacing:'.07em', minWidth:90, paddingTop:1, fontWeight:600 }}>{l}</dt>
                  <dd style={{ fontSize:13, color:T.text }}>{v}</dd>
                </div>
              ))}
            </div>
          )}

          {!result.verified && result.videoHash && (
            <div style={{ borderTop:`1px solid ${T.border}`, paddingTop:14 }}>
              <dt style={{ fontSize:11, color:T.dim, textTransform:'uppercase', letterSpacing:'.07em', fontWeight:600 }}>Searched Hash</dt>
              <dd style={{ fontSize:12, color:T.muted, fontFamily:'JetBrains Mono,monospace', marginTop:6, wordBreak:'break-all' }}>{result.videoHash}</dd>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
