import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { Locale } from "@smart-city/shared";

interface BangkokStats {
  population: number;
  monthlyImmigration: number;
  ageGroup014: number;
  ageGroup1564: number;
  ageGroup65plus: number;
  gdpPerCapitaPPP: number;
  cityRevenueMillionTHB: number;
  employmentRate: number;
  lastUpdated: string;
}

interface StatTile {
  key: string;
  labelTh: string;
  labelEn: string;
  value: number | string;
  unit: string;
  format: "number" | "percent" | "currency";
}

const LABELS: Record<string, { th: string; en: string }> = {
  population: { th: "ประชากร", en: "Population" },
  immigration: { th: "อพยพในเดือน", en: "Monthly Immigration" },
  age014: { th: "อายุ 0-14", en: "Age 0-14" },
  age1564: { th: "อายุ 15-64", en: "Age 15-64" },
  age65plus: { th: "อายุ 65+", en: "Age 65+" },
  income: { th: "รายได้ฉลาด", en: "GDP per Capita" },
  revenue: { th: "รายได้ BMA", en: "City Revenue" },
  employment: { th: "อัตราการจ้างงาน", en: "Employment Rate" }
};

function formatNumber(value: number, format: "number" | "percent" | "currency"): string {
  if (format === "percent") {
    return `${value.toFixed(1)}%`;
  }
  if (format === "currency") {
    return `${Math.floor(value / 1000).toLocaleString()}k`;
  }
  return value.toLocaleString();
}

export interface BangkokStatsBarProps {
  locale: Locale;
}

export default function BangkokStatsBar({ locale }: BangkokStatsBarProps) {
  const [expanded, setExpanded] = useState(false);

  const statsQuery = useQuery({
    queryKey: ["bangkok-stats"],
    queryFn: async () => {
      // Fetch from the Bangkok stats adapter API endpoint
      // TODO: Update with actual API endpoint when registered in server.ts
      const response = await fetch("/api/bangkok-stats", { method: "GET" });
      if (!response.ok) {
        // Return mock data on fetch failure
        return generateMockStats();
      }
      return response.json();
    },
    staleTime: 3600000, // 1 hour
    retry: 2
  });

  const stats = statsQuery.data ?? generateMockStats();

  const tiles: StatTile[] = [
    {
      key: "population",
      labelTh: LABELS.population.th,
      labelEn: LABELS.population.en,
      value: stats.population,
      unit: "",
      format: "number"
    },
    {
      key: "immigration",
      labelTh: LABELS.immigration.th,
      labelEn: LABELS.immigration.en,
      value: stats.monthlyImmigration,
      unit: "/mo",
      format: "number"
    },
    {
      key: "age014",
      labelTh: LABELS.age014.th,
      labelEn: LABELS.age014.en,
      value: stats.ageGroup014,
      unit: "",
      format: "percent"
    },
    {
      key: "income",
      labelTh: LABELS.income.th,
      labelEn: LABELS.income.en,
      value: stats.gdpPerCapitaPPP,
      unit: "USD",
      format: "currency"
    },
    {
      key: "revenue",
      labelTh: LABELS.revenue.th,
      labelEn: LABELS.revenue.en,
      value: stats.cityRevenueMillionTHB,
      unit: "M THB",
      format: "number"
    }
  ];

  return (
    <div className="stats-bar-container" style={styles.container}>
      <div style={styles.header}>
        <span style={styles.title}>
          {locale === "th" ? "สถิติกรุงเทพฯ" : "Bangkok Metrics"}
        </span>
        <button
          onClick={() => setExpanded(!expanded)}
          style={styles.toggleButton}
          aria-label={locale === "th" ? "ขยาย" : "Expand"}
        >
          {expanded ? "−" : "+"}
        </button>
      </div>

      {expanded && (
        <div style={styles.grid}>
          {tiles.map((tile) => (
            <div key={tile.key} style={styles.tile}>
              <div style={styles.label}>
                {locale === "th" ? tile.labelTh : tile.labelEn}
              </div>
              <div style={styles.value}>
                {formatNumber(typeof tile.value === "number" ? tile.value : 0, tile.format)}
              </div>
              {tile.unit && <div style={styles.unit}>{tile.unit}</div>}
            </div>
          ))}
        </div>
      )}

      {!expanded && (
        <div style={styles.compact}>
          {tiles.slice(0, 3).map((tile) => (
            <span key={tile.key} style={styles.compactMetric}>
              {locale === "th" ? tile.labelTh : tile.labelEn}: {formatNumber(typeof tile.value === "number" ? tile.value : 0, tile.format)}
            </span>
          ))}
          <span style={styles.compactMore}>...</span>
        </div>
      )}

      <div style={styles.timestamp}>
        {locale === "th" ? "อัปเดต: " : "Updated: "}
        {new Date(stats.lastUpdated).toLocaleDateString(locale === "th" ? "th-TH" : "en-US")}
      </div>
    </div>
  );
}

function generateMockStats(): BangkokStats {
  return {
    population: 10539000,
    monthlyImmigration: 2850000,
    ageGroup014: 13.8,
    ageGroup1564: 73.2,
    ageGroup65plus: 13.0,
    gdpPerCapitaPPP: 28450,
    cityRevenueMillionTHB: 145800,
    employmentRate: 96.2,
    lastUpdated: new Date().toISOString()
  };
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: "#0f172a",
    borderBottom: "1px solid #334155",
    padding: "12px 16px",
    color: "#e2e8f0",
    fontFamily: "system-ui, -apple-system, sans-serif"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 0
  },
  title: {
    fontSize: "14px",
    fontWeight: 600,
    letterSpacing: "0.5px",
    textTransform: "uppercase",
    color: "#cbd5e1"
  },
  toggleButton: {
    background: "none",
    border: "none",
    color: "#cbd5e1",
    fontSize: "18px",
    cursor: "pointer",
    padding: "0 4px",
    lineHeight: 1
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: "12px",
    marginTop: "12px"
  },
  tile: {
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    padding: "8px 12px",
    borderRadius: "0px",
    minHeight: "64px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between"
  },
  label: {
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.3px",
    color: "#94a3b8",
    marginBottom: "4px"
  },
  value: {
    fontSize: "16px",
    fontWeight: 600,
    color: "#f1f5f9",
    fontFamily: "JetBrains Mono, monospace"
  },
  unit: {
    fontSize: "10px",
    color: "#64748b",
    marginTop: "2px"
  },
  compact: {
    display: "flex",
    gap: "16px",
    fontSize: "13px",
    marginTop: "8px",
    color: "#cbd5e1",
    flexWrap: "wrap"
  },
  compactMetric: {
    display: "inline-block"
  },
  compactMore: {
    color: "#64748b"
  },
  timestamp: {
    fontSize: "10px",
    color: "#64748b",
    marginTop: "8px",
    textAlign: "right"
  }
};
