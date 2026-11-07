import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { MonthlyDashboardData } from "@/app/relatorios/monthly-group-dashboard-data";

const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const styles = StyleSheet.create({
  page: { paddingTop: 28, paddingHorizontal: 32, paddingBottom: 34, fontFamily: "Helvetica", fontSize: 8, color: "#1c2430", backgroundColor: "#fcfdff" },
  title: { fontSize: 17, fontWeight: 700, color: "#0b3a7a" },
  subtitle: { marginTop: 4, marginBottom: 14, color: "#6e849a", fontSize: 9 },
  section: { marginBottom: 12, border: "1 solid #dfe3e8", borderRadius: 8, padding: 10, backgroundColor: "#ffffff" },
  heading: { marginBottom: 6, fontSize: 11, fontWeight: 700, color: "#1c2430" },
  metrics: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  metric: { width: "32%", minHeight: 38, padding: 6, border: "1 solid #dfe3e8", borderRadius: 8 },
  metricLabel: { fontSize: 7, color: "#6e849a" },
  metricValue: { marginTop: 3, fontSize: 12, fontWeight: 700, color: "#1d4ed8" },
  table: { width: "100%" },
  row: { flexDirection: "row", minHeight: 18, borderBottom: "1 solid #e4edf6", alignItems: "center" },
  header: { backgroundColor: "#1d4ed8", color: "#fff", fontWeight: 700, textTransform: "uppercase" },
  cell: { paddingVertical: 4, paddingHorizontal: 5, flexGrow: 1, flexBasis: 0 },
  footer: { position: "absolute", bottom: 16, left: 32, right: 32, textAlign: "right", color: "#6e849a", fontSize: 7 },
});

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function formatDate(value: string) {
  if (!value) return "-";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function Metric({ label, value }: { label: string; value: number }) {
  return <View style={styles.metric} wrap={false}><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{formatNumber(value)}</Text></View>;
}

function Table({ headers, rows, repeatHeader = false }: { headers: string[]; rows: string[][]; repeatHeader?: boolean }) {
  return (
    <View style={styles.table}>
      <View style={[styles.row, styles.header]} fixed={repeatHeader} wrap={false}>
        {headers.map((header) => <Text key={header} style={styles.cell}>{header}</Text>)}
      </View>
      {rows.length ? rows.map((row, index) => (
        <View key={`${index}-${row.join("|")}`} style={styles.row} wrap={false}>
          {row.map((cell, cellIndex) => <Text key={cellIndex} style={styles.cell}>{cell}</Text>)}
        </View>
      )) : <View style={styles.row} wrap={false}><Text style={styles.cell}>Nenhum registro no período.</Text></View>}
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <View style={styles.section}><Text style={styles.heading}>{title}</Text>{children}</View>;
}

export function MonthlyReportPdfDocument({ data, profile }: { data: MonthlyDashboardData; profile: "admin" | "responsavel" }) {
  const period = `${monthNames[data.filters.month - 1]}/${data.filters.year}`;
  const responsible = profile === "responsavel";
  const metrics: [string, number][] = responsible
    ? [
        ["Reuniões", data.consolidated.totalReunioes],
        ["Presenças", data.consolidated.totalPresencas],
        ["Média de Presenças", data.consolidated.mediaPresencasResponsavel],
        ["Conquistas", data.achievements.subtotal],
        ["Visitantes", data.consolidated.visitantes],
        ["Ingressos", data.consolidated.ingressos],
        ["Cidades", data.consolidated.totalCidades],
        ["Estados", data.consolidated.totalEstadosUnicos],
        ["Outros Países", data.consolidated.totalOutrosPaises],
      ] as [string, number][]
    : [
        ["Total de Reuniões", data.consolidated.totalReunioes],
        ["Reuniões sem ATA / Sala Fechada", data.consolidated.reunioesSemAtaOuSalaFechada],
        ["Total de Presenças", data.consolidated.totalPresencas],
        ["Média de presenças", data.consolidated.mediaPresencas],
        ["Visitantes", data.consolidated.visitantes],
        ["Média de Localidades", data.consolidated.mediaLocalidades],
        ["Média de Estados", data.consolidated.mediaEstados],
        ["Total de Países", data.consolidated.totalPaises],
        ["Ingressos", data.consolidated.ingressos],
      ];

  return (
    <Document title={`Relatório Mensal - ${data.group.grupo_nome} - ${period}`}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Relatório Mensal - Grupo {data.group.grupo_nome}</Text>
        <Text style={styles.subtitle}>Período: {period} · {responsible ? "Relatório do grupo" : "Relatório administrativo"}</Text>

        {responsible ? <Section title="Servidores"><Table headers={["Encargo", "Nome", "Desde"]} rows={data.mesa.map((row) => [row.encargo, row.vacant ? "Vago" : row.nome || "-", formatDate(row.data_inicio)])} /></Section> : null}

        <Section title="Consolidado">
          <View style={styles.metrics}>{metrics.map(([label, value]) => <Metric key={label} label={label} value={value} />)}
            {responsible ? <Metric label="Reuniões desde a Fundação" value={data.consolidated.reunioesDesdeFundacao} /> : null}
          </View>
        </Section>

        {responsible ? (
          <Section title="Consolidados por Dia da Semana">
            <Table headers={["Dia da Semana", "Horário", "Presenças", "Média", "Ingressos"]} repeatHeader rows={data.responsavelMeetingResults.flatMap((day) => day.schedules.length
              ? day.schedules.map((schedule) => [day.weekday, schedule.time, formatNumber(schedule.presences), formatNumber(schedule.averagePresences), formatNumber(schedule.ingressos)])
              : [[day.weekday, "-", formatNumber(day.presences), formatNumber(day.averagePresences), formatNumber(day.ingressos)]])} />
          </Section>
        ) : (
          <Section title="Consolidados por Reunião">
            <Table headers={["Horário", ...data.bySchedule.horarios, "Total"]} rows={[
              ["Média part.", ...data.bySchedule.mediaParticipantes.map(formatNumber), formatNumber(data.bySchedule.totalMediaParticipantes)],
              ["Ingressos", ...data.bySchedule.ingressos.map(formatNumber), formatNumber(data.bySchedule.totalIngressos)],
            ]} />
          </Section>
        )}

        <Section title="Conquistas">
          <Table headers={["Conquista", "Total"]} rows={[
            [data.achievements.ingresso.label, formatNumber(data.achievements.ingresso.value)],
            ...data.achievements.rows.map((row) => [row.label, formatNumber(row.value)]),
            ["Subtotal", formatNumber(data.achievements.subtotal)],
            ...(!responsible ? [["Total", formatNumber(data.achievements.total)]] : []),
          ]} />
        </Section>

        {!responsible ? <Section title="Servidores"><Table headers={["Encargo", "Nome", "Desde"]} rows={data.mesa.map((row) => [row.encargo, row.vacant ? "Vago" : row.nome || "-", formatDate(row.data_inicio)])} /></Section> : null}
        <Text style={styles.footer} fixed>GS Mapeamento · Dados do grupo {data.group.grupo_nome} · {period}</Text>
      </Page>
    </Document>
  );
}

export async function renderMonthlyReportPdf(data: MonthlyDashboardData, profile: "admin" | "responsavel") {
  return renderToBuffer(<MonthlyReportPdfDocument data={data} profile={profile} />);
}

export function monthlyReportFilename(data: MonthlyDashboardData) {
  const slug = data.group.grupo_nome.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `relatorio-mensal-${slug}-${data.filters.year}-${String(data.filters.month).padStart(2, "0")}.pdf`;
}
