import { useState, useMemo, useEffect } from 'react'
import {
  DATA, STATES, PHN_CODES, PHN_NAMES, ZONE_MAP, ZONE_NAMES, ZONE_COLORS,
  RA_LABELS, decode, irsdColor,
} from '../utils/data'
import { MetricCard, EquityBar } from './Shared'

const SEL_STYLE = {
  padding: '8px 12px', fontSize: 13,
  border: '1.5px solid var(--c-border)', borderRadius: 'var(--radius-sm)',
  background: 'var(--c-bg)', color: 'var(--c-text)', minWidth: 0,
}

export default function Explorer() {
  const [fState, setFS] = useState('')
  const [fZone, setFZ] = useState('')
  const [fRA, setFRA] = useState('')
  const [fPHN, setFP] = useState('')
  const [fIRSD, setFI] = useState('')
  const [page, setPage] = useState(0)

  const filtered = useMemo(() => {
    return DATA.filter((rec) => {
      if (fState && STATES[rec[1]] !== fState) return false
      const z = ZONE_MAP[rec[3]] || 0
      if (fZone && z !== Number(fZone)) return false
      if (fRA && rec[4] !== Number(fRA)) return false
      if (fPHN && (rec[5] < 0 || PHN_CODES[rec[5]] !== fPHN)) return false
      if (fIRSD) {
        const [lo, hi] = fIRSD.split('-').map(Number)
        if (!rec[9] || rec[9] < lo || rec[9] > hi) return false
      }
      return true
    }).map(decode)
  }, [fState, fZone, fRA, fPHN, fIRSD])

  useEffect(() => setPage(0), [fState, fZone, fRA, fPHN, fIRSD])

  const pageSize = 25
  const pages = Math.ceil(filtered.length / pageSize)
  const slice = filtered.slice(page * pageSize, (page + 1) * pageSize)

  const fStats = useMemo(() => {
    let pop = 0, ind = 0, ic = 0, bot = 0, irc = 0
    filtered.forEach((d) => {
      if (d.erp > 0) pop += d.erp
      if (d.ip > 0) { ind += d.ip; ic++ }
      if (d.id > 0) { irc++; if (d.id <= 2) bot++ }
    })
    return {
      pop,
      avgInd: ic > 0 ? (ind / ic).toFixed(1) : '0',
      bot20: irc > 0 ? ((bot / irc) * 100).toFixed(0) : '0',
    }
  }, [filtered])

  const hasFilters = fState || fZone || fRA || fPHN || fIRSD

  function clearAll() {
    setFS(''); setFZ(''); setFRA(''); setFP(''); setFI('')
  }

  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <select value={fState} onChange={(e) => setFS(e.target.value)} style={SEL_STYLE}>
          <option value="">All states</option>
          {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={fZone} onChange={(e) => setFZ(e.target.value)} style={SEL_STYLE}>
          <option value="">All zones</option>
          {[1, 2, 3, 4].map((z) => <option key={z} value={z}>{ZONE_NAMES[z]}</option>)}
        </select>
        <select value={fRA} onChange={(e) => setFRA(e.target.value)} style={SEL_STYLE}>
          <option value="">All RA</option>
          {[1, 2, 3, 4, 5].map((v) => <option key={v} value={v}>RA{v} — {RA_LABELS[v]}</option>)}
        </select>
        <select value={fPHN} onChange={(e) => setFP(e.target.value)} style={SEL_STYLE}>
          <option value="">All PHNs</option>
          {PHN_CODES.map((c, i) => <option key={c} value={c}>{c} — {PHN_NAMES[i]}</option>)}
        </select>
        <select value={fIRSD} onChange={(e) => setFI(e.target.value)} style={SEL_STYLE}>
          <option value="">All IRSD</option>
          <option value="1-2">Decile 1–2 (most disadvantaged)</option>
          <option value="3-4">Decile 3–4</option>
          <option value="5-6">Decile 5–6</option>
          <option value="7-8">Decile 7–8</option>
          <option value="9-10">Decile 9–10 (least disadvantaged)</option>
        </select>
        {hasFilters && (
          <button onClick={clearAll} style={{
            padding: '8px 14px', fontSize: 12, border: 'none', borderRadius: 'var(--radius-sm)',
            background: 'var(--c-bg3)', color: 'var(--c-text2)', cursor: 'pointer', fontWeight: 600,
          }}>
            Clear all
          </button>
        )}
      </div>

      {/* Summary metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 12 }}>
        <MetricCard label="Matching" value={filtered.length.toLocaleString()} sub="postcodes" />
        <MetricCard label="Population" value={fStats.pop > 0 ? `${(fStats.pop / 1e6).toFixed(2)}M` : '—'} />
        <MetricCard label="Avg Indigenous %" value={`${fStats.avgInd}%`} />
        <MetricCard label="Bottom 20% IRSD" value={`${fStats.bot20}%`} accent={Number(fStats.bot20) > 30 ? '#ef4444' : undefined} />
      </div>

      {/* Table */}
      <div style={{ border: '1px solid var(--c-border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--c-bg2)' }}>
                {['Postcode', 'State', 'Place', 'Zone', 'RA', 'PHN', 'IRSD', 'Indig%', 'Pop'].map((h) => (
                  <th key={h} style={{
                    padding: '10px 10px', textAlign: 'left', fontSize: 11, fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--c-text3)',
                    borderBottom: '1px solid var(--c-border)',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slice.map((d, i) => (
                <tr key={`${d.pc}_${d.st}_${i}`} style={{ borderBottom: '1px solid var(--c-border)' }}>
                  <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{d.pc}</td>
                  <td style={{ padding: '8px 10px' }}>{d.st}</td>
                  <td style={{ padding: '8px 10px', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.pl}</td>
                  <td style={{ padding: '8px 10px' }}>
                    <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 4, background: ZONE_COLORS[d.z], marginRight: 4 }} />
                    {d.zn}
                  </td>
                  <td style={{ padding: '8px 10px' }}>RA{d.ra}</td>
                  <td style={{ padding: '8px 10px', fontSize: 12 }}>{d.hc}</td>
                  <td style={{ padding: '8px 10px' }}><EquityBar decile={d.id} /></td>
                  <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)' }}>{d.ip > 0 ? `${d.ip}%` : '—'}</td>
                  <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{d.erp > 0 ? d.erp.toLocaleString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 14px', borderTop: '1px solid var(--c-border)', background: 'var(--c-bg2)',
          }}>
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              style={{
                padding: '6px 14px', borderRadius: 6, border: '1px solid var(--c-border)',
                background: 'var(--c-bg)', color: 'var(--c-text2)', fontSize: 12,
                cursor: page === 0 ? 'default' : 'pointer', opacity: page === 0 ? 0.4 : 1,
              }}
            >
              Prev
            </button>
            <span style={{ fontSize: 12, color: 'var(--c-text3)' }}>Page {page + 1} of {pages}</span>
            <button
              disabled={page >= pages - 1}
              onClick={() => setPage((p) => p + 1)}
              style={{
                padding: '6px 14px', borderRadius: 6, border: '1px solid var(--c-border)',
                background: 'var(--c-bg)', color: 'var(--c-text2)', fontSize: 12,
                cursor: page >= pages - 1 ? 'default' : 'pointer', opacity: page >= pages - 1 ? 0.4 : 1,
              }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
