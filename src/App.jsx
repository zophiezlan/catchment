import { useState } from 'react'
import Overview from './components/Overview'
import Lookup from './components/Lookup'
import CohortAnalyser from './components/CohortAnalyser'
import Explorer from './components/Explorer'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'lookup', label: 'Lookup' },
  { id: 'cohort', label: 'Cohort' },
  { id: 'explorer', label: 'Explorer' },
]

export default function App() {
  const [tab, setTab] = useState('overview')

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '20px 16px 60px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#059669' }} />
        <span style={{
          fontSize: 11, fontWeight: 600, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: 'var(--c-text3)',
        }}>
          NUAA Postcode Tool
        </span>
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 0, marginBottom: 24,
        borderBottom: '1px solid var(--c-border)',
      }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '10px 18px',
              fontSize: 13,
              fontWeight: tab === t.id ? 600 : 400,
              color: tab === t.id ? 'var(--c-text)' : 'var(--c-text3)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              borderBottom: tab === t.id ? '2px solid #059669' : '2px solid transparent',
              marginBottom: -1,
              transition: 'all 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && <Overview />}
      {tab === 'lookup' && <Lookup />}
      {tab === 'cohort' && <CohortAnalyser />}
      {tab === 'explorer' && <Explorer />}

      {/* Footer */}
      <div style={{
        marginTop: 32, fontSize: 10, color: 'var(--c-text3)',
        textAlign: 'center', lineHeight: 1.7,
      }}>
        AusPost PC001 (Feb 2026) · MMM 2023 · PHN 2017/POA 2021 concordance · Census/SEIFA 2021 · NSW LHD v2.3
      </div>
    </div>
  )
}
