import { useMemo } from 'react'
import {
  DATA, STATES, PHN_CODES, ZONE_MAP, ZONE_NAMES, ZONE_COLORS,
  RA_LABELS, irsdColor,
} from '../utils/data'
import { MetricCard, SectionLabel, HorizBar, MiniBar } from './Shared'

export default function Overview() {
  const stats = useMemo(() => {
    const zones = { 1: 0, 2: 0, 3: 0, 4: 0 }
    const ras = {}
    const states = {}
    const phns = {}
    const irsd = Array(11).fill(0)
    let totalPop = 0, popCount = 0, indSum = 0, indCount = 0

    DATA.forEach((r) => {
      const z = ZONE_MAP[r[3]] || 0
      if (z) zones[z]++
      ras[r[4]] = (ras[r[4]] || 0) + 1
      const st = STATES[r[1]]
      states[st] = (states[st] || 0) + 1
      const phn = r[5] >= 0 ? PHN_CODES[r[5]] : ''
      if (phn) phns[phn] = (phns[phn] || 0) + 1
      if (r[9] > 0) irsd[r[9]]++
      if (r[7] > 0) { totalPop += r[7]; popCount++ }
      if (r[8] > 0) { indSum += r[8]; indCount++ }
    })

    return {
      zones, ras, states, phns, irsd, totalPop, popCount,
      avgInd: indCount > 0 ? (indSum / indCount).toFixed(1) : '0',
      indCount,
    }
  }, [])

  const zoneData = [1, 2, 3, 4].map((z) => ({
    name: ZONE_NAMES[z], value: stats.zones[z], color: ZONE_COLORS[z],
  }))

  const raData = Object.entries(stats.ras)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([k, v]) => ({
      name: `RA${k}`,
      value: v,
      color: ['', '#3b82f6', '#059669', '#d97706', '#f97316', '#dc2626'][k],
    }))

  const stateData = Object.entries(stats.states)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => ({ name: k, value: v, color: '#059669' }))

  const irsdData = stats.irsd.slice(1).map((v, i) => ({
    name: String(i + 1), value: v, color: irsdColor(i + 1),
  }))

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 8 }}>
        <MetricCard label="Postcodes" value={DATA.length.toLocaleString()} sub="unique postcode×state" />
        <MetricCard label="PHN regions" value={Object.keys(stats.phns).length} sub="all PHNs covered" />
        <MetricCard label="Coverage pop" value={`${(stats.totalPop / 1e6).toFixed(1)}M`} sub={`${stats.popCount} postcodes with ERP`} />
        <MetricCard label="Avg Indigenous %" value={`${stats.avgInd}%`} sub={`${stats.indCount} postcodes with data`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <SectionLabel>Shipping zone distribution</SectionLabel>
          <HorizBar items={zoneData} total={DATA.length} />
        </div>
        <div>
          <SectionLabel>Remoteness area</SectionLabel>
          <HorizBar items={raData} total={DATA.length} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <SectionLabel>By state</SectionLabel>
          <MiniBar data={stateData} dataKey="value" nameKey="name" colors={stateData.map((d) => d.color)} />
        </div>
        <div>
          <SectionLabel>IRSD decile distribution</SectionLabel>
          <MiniBar data={irsdData} dataKey="value" nameKey="name" colors={irsdData.map((d) => d.color)} height={180} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--c-text3)', marginTop: 2, padding: '0 4px' }}>
            <span>Most disadvantaged</span>
            <span>Least disadvantaged</span>
          </div>
        </div>
      </div>
    </div>
  )
}
