import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { salesApi, type Sale, type SaleReport, type RevenueTrendItem } from "@/api/sales";
import { money } from "@/lib/format";
import { cacheGet, cacheSet, cacheKey } from "@/lib/simple-cache";
import TableSkeleton from "@/components/common/TableSkeleton";
import { ReportStats } from "@/components/pages/reports/ReportStats";
import { CashCloseCard } from "@/components/pages/reports/CashCloseCard";
import { TopProductsCard } from "@/components/pages/reports/TopProductsCard";
import styles from "./Reports.module.css";

type Range = "today" | "week" | "month";

function rangeStart(r: Range) {
  const d = new Date();
  if (r === "today") { d.setHours(0, 0, 0, 0); return d; }
  if (r === "week") { d.setDate(d.getDate() - 7); return d; }
  d.setDate(d.getDate() - 30);
  return d;
}

function rangeEnd(r: Range) {
  const d = new Date();
  if (r === "today") { d.setHours(23, 59, 59, 999); return d; }
  return d;
}

const SKELETON_COLS = [
  { width: "50%" },
  { width: "30%" },
  { width: "20%", align: "right" as const },
];

type ChartRange = "7d" | "30d" | "4w" | "1y";

const CHART_RANGE_OPTIONS: { value: ChartRange; label: string }[] = [
  { value: "7d", label: "Ultimos 7 dias" },
  { value: "30d", label: "Ultimos 30 dias" },
  { value: "4w", label: "Ultimas 4 semanas" },
  { value: "1y", label: "Ano" },
];

const CHART_BAR_FILL = "#3b82f6";
const CHART_LINE_COLOR = "#3b82f6";

export default function Reports() {
  const [range, setRange] = useState<Range>("today");
  const [report, setReport] = useState<SaleReport | null>(() => {
    const cached = cacheGet<{ report: SaleReport; sales: Sale[] }>(cacheKey("reports", "today"));
    return cached?.report ?? null;
  });
  const [sales, setSales] = useState<Sale[]>(() => {
    const cached = cacheGet<{ report: SaleReport; sales: Sale[] }>(cacheKey("reports", "today"));
    return cached?.sales ?? [];
  });
  const [loading, setLoading] = useState(true);
  const [salesPage, setSalesPage] = useState(1);
  const [salesTotal, setSalesTotal] = useState(0);
  const SALES_LIMIT = 10;

  const salesTotalPages = Math.max(1, Math.ceil(salesTotal / SALES_LIMIT));

  useEffect(() => {
    const start = rangeStart(range).toISOString();
    const end = rangeEnd(range).toISOString();
    const key = cacheKey("reports", range, String(salesPage));
    const cached = cacheGet<{ report: SaleReport; sales: Sale[]; total: number }>(key);

    if (cached) { setReport(cached.report); setSales(cached.sales); setSalesTotal(cached.total); }
    setLoading(!cached);

    Promise.all([
      salesApi.report({ start_date: start, end_date: end }),
      salesApi.list({ start_date: start, end_date: end, page: salesPage, limit: SALES_LIMIT }),
    ])
      .then(([r, list]) => {
        setReport(r);
        setSales(list.sales);
        setSalesTotal(list.total);
        cacheSet(key, { report: r, sales: list.sales, total: list.total });
      })
      .catch((err) => console.error("Error al cargar reportes:", err))
      .finally(() => setLoading(false));
  }, [range, salesPage]);

  useEffect(() => { setSalesPage(1); }, [range]);

  const hasData = report !== null;

  if (loading && !hasData) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.h1}>Reportes</h1>
            <p className={styles.subtitle}>Resumen de ventas y productos</p>
          </div>
          <div className={`${styles.select} ${styles.skeletonBar} ${styles["skeleton-header"]}`} />
        </header>
        <div className={styles.statsGrid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={styles.statCard}>
              <div className={`${styles.skeletonBar} ${styles["skeleton-stat-up"]}`} />
              <div className={`${styles.skeletonBar} ${styles["skeleton-stat-down"]}`} />
            </div>
          ))}
        </div>
        <div className={styles.twoCol}>
          <div className={styles.card}>
            <div className={`${styles.skeletonBar} ${styles["skeleton-card-title"]}`} />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`${styles.skeletonBar} ${styles["skeleton-card-line"]}`} />
            ))}
          </div>
          <div className={styles.card}>
            <div className={styles.skeletonBar} style={{ width: "50%", height: 16, marginBottom: 16 }} />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={styles.skeletonBar} style={{ width: `${50 + i * 8}%`, height: 14, marginBottom: 8 }} />
            ))}
          </div>
        </div>
        <div className={styles.recentCard}>
          <div className={`${styles.skeletonBar} ${styles["skeleton-recent-title"]}`} />
          <div className={styles.tableWrapper}><table className={styles.table}>
            <thead><tr><th>Fecha</th><th>Método</th><th>Total</th></tr></thead>
            <tbody><TableSkeleton cols={SKELETON_COLS} rows={5} /></tbody>
          </table></div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.h1}>Reportes</h1>
          <p className={styles.subtitle}>Resumen de ventas y productos</p>
        </div>
        <select value={range} onChange={(e) => setRange(e.target.value as Range)} className={styles.select}>
          <option value="today">Hoy</option>
          <option value="week">Últimos 7 días</option>
          <option value="month">Últimos 30 días</option>
        </select>
      </header>

      <ReportStats report={report} />

      <ChartsSection report={report} />

      <div className={styles.twoCol}>
        <CashCloseCard
          report={report}
          rangeLabel={range === "today" ? "hoy" : range === "week" ? "7 días" : "30 días"}
        />
        <TopProductsCard report={report} />
      </div>

      {}
      <section className={styles.recentCard}>
        <h2 className={styles.recentTitle}>Últimas ventas</h2>
        <div className={styles.tableWrapper}><table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.thLeft}>Fecha</th>
              <th className={styles.thLeft}>Método</th>
              <th className={styles.thRight}>Total</th>
            </tr>
          </thead>
          <tbody>
            {sales.length > 0 ? (
              sales.map((s) => (
                <tr key={s.id} className={`${styles.tr} ${loading ? styles.trDim : ""}`}>
                  <td className={styles.tdDate}>{new Date(s.created_at).toLocaleString("es-MX")}</td>
                  <td className={styles.tdMethod}>{s.payment_method}</td>
                  <td className={styles.tdRight}>{money(s.total)}</td>
                </tr>
              ))
            ) : loading ? (
              <TableSkeleton cols={SKELETON_COLS} rows={5} />
            ) : (
              <tr><td colSpan={3} className={styles.empty}>Sin ventas</td></tr>
            )}
          </tbody>
        </table></div>

        {salesTotalPages > 1 && (
          <div className={styles.pagination}>
            <button onClick={() => setSalesPage((p) => Math.max(1, p - 1))} disabled={salesPage <= 1} className={styles.pageBtn}>
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: salesTotalPages }, (_, i) => i + 1).map((n) => (
              <button key={n} onClick={() => setSalesPage(n)} className={`${styles.pageBtn} ${n === salesPage ? styles.pageActive : ""}`}>{n}</button>
            ))}
            <button onClick={() => setSalesPage((p) => Math.min(salesTotalPages, p + 1))} disabled={salesPage >= salesTotalPages} className={styles.pageBtn}>
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function ChartsSection({ report }: { report: SaleReport | null }) {
  const [chartRange, setChartRange] = useState<ChartRange>("7d");
  const [trendData, setTrendData] = useState<RevenueTrendItem[]>([]);
  const [trendLoading, setTrendLoading] = useState(false);

  useEffect(() => {
    const now = new Date();
    let start: Date;
    let groupBy: "day" | "week" | "month";

    switch (chartRange) {
      case "7d": start = new Date(now); start.setDate(start.getDate() - 7); groupBy = "day"; break;
      case "30d": start = new Date(now); start.setDate(start.getDate() - 30); groupBy = "day"; break;
      case "4w": start = new Date(now); start.setDate(start.getDate() - 28); groupBy = "week"; break;
      case "1y": start = new Date(now); start.setFullYear(start.getFullYear() - 1); groupBy = "month"; break;
    }

    setTrendLoading(true);
    salesApi.revenueTrend({ start_date: start!.toISOString(), end_date: now.toISOString(), group_by: groupBy! })
      .then(setTrendData)
      .catch((err) => console.error("Error al cargar tendencia:", err))
      .finally(() => setTrendLoading(false));
  }, [chartRange]);

  const productData = (report?.top_products ?? []).map((p) => ({ name: p.product_name, revenue: p.revenue }));
  const hasProducts = productData.length > 0;

  function formatXLabel(dateStr: string) {
    const d = new Date(dateStr);
    if (chartRange === "1y") return d.toLocaleDateString("es-MX", { month: "short" });
    if (chartRange === "4w") return `${d.toLocaleDateString("es-MX", { day: "numeric", month: "short" })}`;
    return d.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
  }

  function periodLabel() {
    switch (chartRange) { case "7d": return "dia"; case "30d": return "dia"; case "4w": return "semana"; case "1y": return "mes"; }
  }

  const totalRevenue = trendData.reduce((sum, i) => sum + i.revenue, 0);
  const avgRevenue = trendData.length > 0 ? totalRevenue / trendData.length : 0;
  const maxItem = trendData.reduce((best, i) => (i.revenue > best.revenue ? i : best), { date: "", revenue: 0 });

  return (
    <div className={styles.chartsGrid}>
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <h2 className={styles.cardTitle}>Ingresos</h2>
          <select value={chartRange} onChange={(e) => setChartRange(e.target.value as ChartRange)} className={styles.select}>
            {CHART_RANGE_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
          </select>
        </div>
        {trendData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trendData} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tickFormatter={formatXLabel} tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis tickFormatter={(v) => money(v as number)} tick={{ fontSize: 11 }} width={70} />
              <Tooltip labelFormatter={(dateStr) => new Date(dateStr as string).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })} formatter={(v) => [money(v as number), "Ingresos"]} />
              <Line type="monotone" dataKey="revenue" stroke={CHART_LINE_COLOR} strokeWidth={2} dot={{ r: 4, fill: CHART_LINE_COLOR, strokeWidth: 0 }} activeDot={{ r: 6, fill: CHART_LINE_COLOR, strokeWidth: 2, stroke: "#fff" }} />
            </LineChart>
          </ResponsiveContainer>
        ) : trendLoading ? (
          <div className={styles.chartEmpty}>Cargando...</div>
        ) : (
          <div className={styles.chartEmpty}>Sin datos en este periodo</div>
        )}
        {trendData.length > 0 && (
          <div className={styles.chartSummary}>
            <div className={styles.summaryItem}><span className={styles.summaryLabel}>Total</span><span className={styles.summaryValue}>{money(totalRevenue)}</span></div>
            <div className={styles.summaryItem}><span className={styles.summaryLabel}>Promedio por {periodLabel()}</span><span className={styles.summaryValue}>{money(avgRevenue)}</span></div>
            <div className={styles.summaryItem}><span className={styles.summaryLabel}>Mejor {periodLabel()}</span><span className={styles.summaryValue}>{money(maxItem.revenue)}</span></div>
            <div className={styles.summaryItem}><span className={styles.summaryLabel}>Periodos</span><span className={styles.summaryValue}>{trendData.length}</span></div>
          </div>
        )}
      </div>
      <div className={styles.chartCard}>
        <h2 className={styles.cardTitle}>Productos mas vendidos por ingreso</h2>
        {hasProducts ? (
          <ResponsiveContainer width="100%" height={Math.max(200, productData.length * 40)}>
            <BarChart data={productData} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tickFormatter={(v) => money(v as number)} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} tickFormatter={(v) => ((v as string).length > 18 ? (v as string).slice(0, 16) + "..." : v as string)} />
              <Tooltip formatter={(v) => money(v as number)} />
              <Bar dataKey="revenue" fill={CHART_BAR_FILL} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className={styles.chartEmpty}>Sin datos en este periodo</div>
        )}
      </div>
    </div>
  );
}
