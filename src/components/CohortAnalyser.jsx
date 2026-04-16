import { useState } from 'react'
import {
  PIDX, decode, ZONE_NAMES, ZONE_COLORS, irsdColor,
} from '../utils/data'
import { MetricCard, SectionLabel, HorizBar, MiniBar, Pill } from './Shared'

export default function CohortAnalyser() {
  const [raw, setRaw] = useState('')
  const [results, setResults] = useState(null)

  function analyse() {
    const pcs = raw.match(/\d{3,4}/g) || []
    const unique = [...new Set(pcs.map(Number))]
    const matched = []
    const missed = []

    unique.forEach((pc) => {
      if (PIDX[pc]) matched.push(decode(PIDX[pc]))
      else missed.push(pc)
    })

    if (!matched.length) { setResults({ empty: true }); return }

    const zones = { 1: 0, 2: 0, 3: 0, 4: 0 }
    const ras = {}
    const phns = {}
    const lhds = {}
    const states = {}
    const irsd = Array(11).fill(0)
    let popTot = 0, indW = 0, indPop = 0

    matched.forEach((d) => {
      zones[d.z] = (zones[d.z] || 0) + 1
      ras[d.ra] = (ras[d.ra] || 0) + 1
      if (d.hn) phns[d.hn] = (phns[d.hn] || 0) + 1
      if (d.lhd) lhds[d.lhd] = (lhds[d.lhd] || 0) + 1
      states[d.st] = (states[d.st] || 0) + 1
      if (d.id > 0) irsd[d.id]++
      if (d.erp > 0) popTot += d.erp
      if (d.ip > 0) { indW += d.ip; indPop++ }
    })

    const bot20 = irsd.slice(1, 3).reduce((a, b) => a + b, 0)
    const withIrsd = irsd.slice(1).reduce((a, b) => a + b, 0)

    setResults({
      inputCount: pcs.length,
      uniqueCount: unique.length,
      matchCount: matched.length,
      missed,
      zones, ras, phns, lhds, states, irsd, popTot,
      avgInd: indPop > 0 ? (indW / indPop).toFixed(1) : '0',
      indPop,
      bot20, withIrsd,
      bot20pct: withIrsd > 0 ? ((bot20 / withIrsd) * 100).toFixed(0) : '0',
      total: matched.length,
    })
  }

  const r = results

  return (
    <div>
      <div style={{ fontSize: 13, color: 'var(--c-text2)', marginBottom: 10 }}>
        Paste postcodes from an event list, service contacts, or distribution data.
        One per line, comma-separated, or space-separated.
      </div>

      <textarea
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        placeholder={'2560\n2000\n2250\n4000\n...'}
        rows={6}
        style={{
          width: '100%', boxSizing: 'border-box', padding: 12,
          fontSize: 14, fontFamily: 'var(--font-mono)',
          border: '2px solid var(--c-border)', borderRadius: 10,
          background: 'var(--c-bg)', color: 'var(--c-text)',
          resize: 'vertical', lineHeight: 1.6,
        }}
      />

      <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
        <button
          onClick={analyse}
          disabled={!raw.trim()}
          style={{
            padding: '10px 24px', borderRadius: 10, border: 'none',
            background: raw.trim() ? '#059669' : 'var(--c-bg3)',
            color: raw.trim() ? '#fff' : 'var(--c-text3)',
            fontSize: 14, fontWeight: 600,
            cursor: raw.trim() ? 'pointer' : 'default',
          }}
        >
          Analyse cohort
        </button>
        {r && !r.empty && (
          <span style={{ fontSize: 12, color: 'var(--c-text3)' }}>
            {r.inputCount} postcodes entered, {r.uniqueCount} unique, {r.matchCount} matched
          </span>
        )}
      </div>

      {r && r.empty && (
        <div style={{ marginTop: 16, padding: 14, borderRadius: 10, border: '1px dashed var(--c-border2)', color: 'var(--c-text2)', fontSize: 13, textAlign: 'center' }}>
          No valid postcodes found in input
        </div>
      )}

      {r && !r.empty && (
        <div style={{ marginTop: 16, animation: 'fadeIn 0.3s ease' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 8 }}>
            <MetricCard label="Postcodes matched" value={r.matchCount} />
            <MetricCard label="PHN regions" value={Object.keys(r.phns).length} />
            <MetricCard label="Bottom 20% IRSD" value={`${r.bot20pct}%`} sub={`${r.bot20} of ${r.withIrsd} with data`} accent={Number(r.bot20pct) > 30 ? '#ef4444' : undefined} />
            <MetricCard label="Avg Indigenous %" value={`${r.avgInd}%`} sub={`${r.indPop} postcodes with data`} />
          </div>

          {r.missed.length > 0 && (
            <div style={{ fontSize: 12, color: '#92400e', background: '#fef3c7', padding: '8px 12px', borderRadius: 8, marginBottom: 12 }}>
              {r.missed.length} postcode{r.missed.length > 1 ? 's' : ''} not found: {r.missed.slice(0, 10).join(', ')}{r.missed.length > 10 ? '...' : ''}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <SectionLabel>Zone breakdown</SectionLabel>
              <HorizBar items={[1, 2, 3, 4].map((z) => ({ name: ZONE_NAMES[z], value: r.zones[z] || 0, color: ZONE_COLORS[z] }))} total={r.total} />
            </div>
            <div>
              <SectionLabel>Remoteness</SectionLabel>
              <HorizBar
                items={Object.entries(r.ras).sort((a, b) => Number(a[0]) - Number(b[0])).map(([k, v]) => ({
                  name: `RA${k}`, value: v,
                  color: ['', '#3b82f6', '#059669', '#d97706', '#f97316', '#dc2626'][k],
                }))}
                total={r.total}
              />
            </div>
          </div>

          <SectionLabel>PHN spread</SectionLabel>
          <HorizBar
            items={Object.entries(r.phns).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ name: k, value: v, color: '#059669' }))}
            total={r.total}
          />

          {Object.keys(r.lhds).length > 0 && (
            <div>
              <SectionLabel>NSW Local Health Districts</SectionLabel>
              <HorizBar
                items={Object.entries(r.lhds).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ name: k.replace(' LHD', ''), value: v, color: '#3b82f6' }))}
                total={r.total}
              />
            </div>
          )}

          <SectionLabel>IRSD decile distribution</SectionLabel>
          <MiniBar
            data={r.irsd.slice(1).map((v, i) => ({ name: String(i + 1), value: v, color: irsdColor(i + 1) }))}
            dataKey="value" nameKey="name"
            colors={r.irsd.slice(1).map((_, i) => irsdColor(i + 1))}
            height={160}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--c-text3)', padding: '2px 4px 0' }}>
            <span>Most disadvantaged</span><span>Least disadvantaged</span>
          </div>

          <SectionLabel>States</SectionLabel>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {Object.entries(r.states).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
              <Pill key={k}>{k}: {v}</Pill>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
