import { Card } from "./Shared";
import MapShell from "./map/MapShell";
import { MAP_LAYERS } from "./map/layers";

export default function MapView() {
  return (
    <div>
      <Card
        style={{
          marginBottom: 20,
          padding: "20px 24px",
          background: "var(--c-accent-light)",
          borderColor: "rgba(5,150,105,0.15)",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 14,
            fontWeight: 600,
            color: "var(--c-accent)",
            marginBottom: 8,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="2,12 6,4 10,8 14,3 14,13 2,13" />
          </svg>
          NSW harm-reduction map
        </div>
        <p
          style={{
            fontSize: 14,
            lineHeight: 1.7,
            color: "var(--c-text2)",
            margin: 0,
          }}
        >
          Spatial view of services and demographics across NSW. Toggle layers on
          the right to combine NSP outlets, OTP sites, ACCHS, LHD boundaries,
          and SEIFA disadvantage. For tables and filtering use{" "}
          <strong style={{ color: "var(--c-text)" }}>Explorer</strong>; for the
          coverage analytic see{" "}
          <strong style={{ color: "var(--c-text)" }}>Gap Analysis</strong>.
        </p>
      </Card>

      <MapShell layers={MAP_LAYERS} height={560} />
    </div>
  );
}
