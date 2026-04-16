import { useState, useMemo, useRef } from 'react'
import {
  IDX, ALL_POSTCODES, decode,
  ZONE_COLORS, ZONE_COLORS_LIGHT, ZONE_COLORS_TEXT,
} from '../utils/data'
import { Pill, EquityBar, FieldLabel } from './Shared'

export default function Lookup() {
  const [q, setQ] = useState('')
  const [res, setRes] = useState(null)
  const [sugg, setSugg] = useState([])
  const [open, setOpen] = useState(false)
  const [si, setSi] = useState(-1)
  const iRef = useRef(null)

  function doSearch(v) {
    setQ(v)
    setSi(-1)
    const t = v.trim()
    if (t.length >= 2 && /^\d+$/.test(t)) {
      const m = ALL_POSTCODES.filter((p) => String(p).startsWith(t)).slice(0, 6)
      setSugg(m)
      setOpen(m.length > 0)
    } else {
      setSugg([])
      setOpen(false)
    }
    const n = Number(t)
    if (IDX[n]) { setRes(IDX[n]); setOpen(false) }
    else setRes(null)
  }

  function pick(pc) {
    setQ(String(pc))
    setRes(IDX[pc])
    setOpen(false)
  }

  function handleKey(e) {
    if (!open || !sugg.length) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setSi((i) => Math.min(i + 1, sugg.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSi((i) => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter' && si >= 0) { e.preventDefault(); pick(sugg[si]) }
  }

  const d = res ? decode(res[0]) : null

  return (
    <div style={{ maxWidth: 520 }}>
      {/* Search input */}
      <div style={{ position: 'relative', marginBottom: 8 }}>
        <div style={{ position: 'relative' }}>
          <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--c-text3)" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="10.5" cy="10.5" r="7" />
            <line x1="15.5" y1="15.5" x2="21" y2="21" />
          </svg>
          <input
            ref={iRef}
            type="text"
            inputMode="numeric"
            placeholder="Enter postcode..."
            value={q}
            onChange={(e) => doSearch(e.target.value)}
            onFocus={() => sugg.length > 0 && setOpen(true)}
            onKeyDown={handleKey}
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '12px 40px 12px 42px', fontSize: 17,
              fontFamily: 'var(--font-mono)', fontWeight: 500,
              border: '2px solid var(--c-border)', borderRadius: 'var(--radius)',
              background: 'var(--c-bg)', color: 'var(--c-text)',
            }}
          />
          {q && (
            <button
              onClick={() => { setQ(''); setRes(null); setSugg([]); iRef.current?.focus() }}
              style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'var(--c-bg3)', border: 'none', borderRadius: 20,
                width: 24, height: 24, cursor: 'pointer', color: 'var(--c-text2)',
                fontSize: 14, fontWeight: 700,
              }}
            >
              ×
            </button>
          )}
        </div>

        {/* Suggestions dropdown */}
        {open && sugg.length > 0 && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50,
            background: 'var(--c-bg)', border: '1px solid var(--c-border2)',
            borderRadius: 'var(--radius)', overflow: 'hidden',
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          }}>
            {sugg.map((pc, i) => {
              const dd = decode(IDX[pc][0])
              return (
                <div
                  key={pc}
                  onClick={() => pick(pc)}
                  onMouseEnter={() => setSi(i)}
                  style={{
                    padding: '10px 16px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: i === si ? 'var(--c-bg2)' : 'transparent',
                    borderBottom: i < sugg.length - 1 ? '1px solid var(--c-border)' : 'none',
                  }}
                >
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 15, minWidth: 44 }}>{pc}</span>
                  <span style={{ fontSize: 13, color: 'var(--c-text2)' }}>{dd.pl}</span>
                  <span style={{ fontSize: 12, color: 'var(--c-text3)', marginLeft: 'auto' }}>{dd.st}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Result card */}
      {d && (
        <div style={{
          border: '1px solid var(--c-border)', borderRadius: 16,
          overflow: 'hidden', background: 'var(--c-bg)',
          animation: 'fadeIn 0.25s ease',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '16px 20px', background: 'var(--c-bg2)',
            borderBottom: '1px solid var(--c-border)',
          }}>
            <div style={{ fontSize: 32, fontWeight: 600, fontFamily: 'var(--font-mono)', letterSpacing: '-0.03em' }}>{d.pc}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <Pill bg={ZONE_COLORS_LIGHT[d.z]} color={ZONE_COLORS_TEXT[d.z]} border={ZONE_COLORS[d.z]}>
                  {d.zn} — Zone {d.z}
                </Pill>
                <Pill>{d.st}</Pill>
              </div>
              <div style={{ fontSize: 15, fontWeight: 500, paddingLeft: 2 }}>{d.pl}</div>
            </div>
          </div>

          {/* Fields grid */}
          <div style={{ padding: '14px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 28px' }}>
            <div><FieldLabel>MMM</FieldLabel><div style={{ fontSize: 15, fontWeight: 500 }}>MMM{d.mmm}</div><div style={{ fontSize: 12, color: 'var(--c-text2)' }}>{d.ml}</div></div>
            <div><FieldLabel>Remoteness</FieldLabel><div style={{ fontSize: 15, fontWeight: 500 }}>RA{d.ra}</div><div style={{ fontSize: 12, color: 'var(--c-text2)' }}>{d.rl}</div></div>
            <div><FieldLabel>PHN</FieldLabel><div style={{ fontSize: 15, fontWeight: 500 }}>{d.hn}</div><div style={{ fontSize: 12, color: 'var(--c-text2)' }}>{d.hc}</div></div>
            {d.lhd && <div><FieldLabel>NSW LHD</FieldLabel><div style={{ fontSize: 15, fontWeight: 500 }}>{d.lhd}</div></div>}
            <div><FieldLabel>Population</FieldLabel><div style={{ fontSize: 15, fontWeight: 500 }}>{d.erp ? d.erp.toLocaleString() : 'No data'}</div></div>
          </div>

          {/* Equity section */}
          <div style={{ margin: '0 20px', padding: '14px 0', borderTop: '1px solid var(--c-border)' }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--c-text3)', marginBottom: 10 }}>Equity</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 28px' }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--c-text2)', marginBottom: 4 }}>SEIFA disadvantage</div>
                <EquityBar decile={d.id} />
                {d.id > 0 && d.id <= 2 && <div style={{ fontSize: 11, fontWeight: 600, color: '#ef4444', marginTop: 3 }}>Bottom 20% nationally</div>}
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--c-text2)', marginBottom: 4 }}>Indigenous population</div>
                <div style={{ fontSize: 24, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{d.ip > 0 ? `${d.ip}%` : '—'}</div>
                {d.ip > 0 && <div style={{ fontSize: 11, color: 'var(--c-text3)', marginTop: 2 }}>Census 2021</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {!res && q.length >= 4 && /^\d+$/.test(q) && (
        <div style={{
          marginTop: 12, padding: 14, borderRadius: 10,
          border: '1px dashed var(--c-border2)',
          color: 'var(--c-text2)', fontSize: 13, textAlign: 'center',
        }}>
          No postcode found for <strong style={{ fontFamily: 'var(--font-mono)' }}>{q}</strong>
        </div>
      )}
    </div>
  )
}
