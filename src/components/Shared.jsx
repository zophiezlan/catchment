import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { irsdColor } from '../utils/data'

export function Pill({ children, bg, color, border }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 10px',
        borderRadius: 100,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.02em',
        background: bg || 'var(--c-bg2)',
        color: color || 'var(--c-text2)',
        border: `1px solid ${border || 'var(--c-border)'}`,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  )
}

export function MetricCard({ label, value, sub, accent }) {
  return (
    <div
      style={{
        padding: '14px 16px',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--c-border)',
        background: 'var(--c-bg)',
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: 'var(--c-text3)',
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 24,
          fontWeight: 600,
          fontFamily: 'var(--font-mono)',
          color: accent || 'var(--c-text)',
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 12, color: 'var(--c-text2)', marginTop: 4 }}>
          {sub}
        </div>
      )}
    </div>
  )
}

export function SectionLabel({ children }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: 'var(--c-text3)',
        marginBottom: 10,
        marginTop: 20,
      }}
    >
      {children}
    </div>
  )
}

export function HorizBar({ items, total }) {
  return (
    <div>
      {items.map((it, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 6,
          }}
        >
          <div
            style={{
              width: 100,
              fontSize: 12,
              color: 'var(--c-text2)',
              textAlign: 'right',
              flexShrink: 0,
              lineHeight: 1.3,
            }}
          >
            {it.name}
          </div>
          <div
            style={{
              flex: 1,
              height: 20,
              background: 'var(--c-bg3)',
              borderRadius: 4,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${Math.max(1, (it.value / total) * 100)}%`,
                background: it.color || '#059669',
                borderRadius: 4,
                transition: 'width 0.4s ease',
              }}
            />
          </div>
          <div
            style={{
              width: 40,
              fontSize: 12,
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              color: 'var(--c-text)',
              textAlign: 'right',
            }}
          >
            {it.value}
          </div>
          <div
            style={{
              width: 36,
              fontSize: 11,
              color: 'var(--c-text3)',
              textAlign: 'right',
            }}
          >
            {((it.value / total) * 100).toFixed(0)}%
          </div>
        </div>
      ))}
    </div>
  )
}

export function MiniBar({ data, dataKey, nameKey, colors, height = 180 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <XAxis
          dataKey={nameKey}
          tick={{ fontSize: 11, fill: 'var(--c-text3)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis hide />
        <Tooltip
          contentStyle={{
            background: 'var(--c-bg)',
            border: '1px solid var(--c-border2)',
            borderRadius: 8,
            fontSize: 12,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }}
          cursor={{ fill: 'var(--c-bg2)', radius: 4 }}
        />
        <Bar dataKey={dataKey} radius={[4, 4, 0, 0]}>
          {data.map((e, i) => (
            <Cell
              key={i}
              fill={colors ? colors[i % colors.length] : e.color || '#059669'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function EquityBar({ decile }) {
  if (!decile)
    return (
      <span style={{ fontSize: 12, color: 'var(--c-text3)' }}>No data</span>
    )

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ display: 'flex', gap: 1.5, flex: 1 }}>
        {Array.from({ length: 10 }, (_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 6,
              borderRadius: 2,
              background:
                i < decile ? irsdColor(decile) : 'var(--c-border)',
              opacity: i < decile ? 1 : 0.3,
              transition: `all 0.2s ease ${i * 20}ms`,
            }}
          />
        ))}
      </div>
      <span
        style={{
          fontSize: 12,
          fontFamily: 'var(--font-mono)',
          fontWeight: 600,
          color: irsdColor(decile),
          minWidth: 28,
        }}
      >
        {decile}/10
      </span>
    </div>
  )
}

export function FieldLabel({ children }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: 'var(--c-text3)',
        marginBottom: 3,
      }}
    >
      {children}
    </div>
  )
}
