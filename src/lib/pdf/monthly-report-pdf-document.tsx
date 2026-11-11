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
  responsibleMetrics: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  foundationMetrics: { flexDirection: "row", justifyContent: "space-between", gap: 9, marginBottom: 9 },
  metric: { width: "32%", minHeight: 38, padding: 6, border: "1 solid #dfe3e8", borderRadius: 8 },
  responsibleMetric: { minHeight: 54, padding: 9, borderRadius: 9 },
  metricHalf: { width: "49%" },
  metricLabel: { fontSize: 7, color: "#6e849a" },
  responsibleMetricLabel: { fontSize: 8.25, lineHeight: 1.2, color: "#6e849a" },
  metricValue: { marginTop: 3, fontSize: 12, fontWeight: 700, color: "#1d4ed8" },
  responsibleMetricValue: { fontSize: 22.5, lineHeight: 1, fontWeight: 700, color: "#1d4ed8" },
  foundationDateValue: { marginTop: 3, fontSize: 18, lineHeight: 1, fontWeight: 700, color: "#1d4ed8" },
  achievementGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  achievementCard: { width: "32%", minHeight: 54, padding: 9, border: "1 solid #dfe3e8", borderRadius: 9, backgroundColor: "#ffffff" },
  achievementLabelLine: { flexDirection: "row", alignItems: "center", gap: 4 },
  achievementLabel: { flexGrow: 1, fontSize: 8.25, lineHeight: 1.2, fontWeight: 600, color: "#6e849a" },
  achievementDot: { width: 4, height: 4, borderRadius: 2 },
  achievementValue: { marginTop: 3, fontSize: 22.5, lineHeight: 1, fontWeight: 700, color: "#1d4ed8" },
  table: { width: "100%" },
  row: { flexDirection: "row", minHeight: 18, borderBottom: "1 solid #e4edf6", alignItems: "center" },
  lastRow: { borderBottomWidth: 0 },
  header: { backgroundColor: "#1d4ed8", color: "#fff", fontWeight: 700, textTransform: "uppercase" },
  cell: { paddingVertical: 4, paddingHorizontal: 5, flexGrow: 1, flexBasis: 0 },
  tableFrame: { border: "1 solid #e4edf6", borderRadius: 8, overflow: "hidden" },
  framedCell: { borderRight: "1 solid #e4edf6" },
  lastCell: { borderRightWidth: 0 },
  meetingHeader: { flexDirection: "row", minHeight: 22, alignItems: "center", borderBottom: "1 solid #e4edf6", backgroundColor: "#1d4ed8" },
  meetingHeaderDay: { width: "20%", alignSelf: "stretch", flexDirection: "row", alignItems: "center", justifyContent: "center" },
  meetingHeaderSeparator: { borderRight: "1 solid #e4edf6" },
  meetingHeaderDetails: { flex: 1, flexDirection: "row" },
  meetingHeaderCell: { flexGrow: 1, flexBasis: 0, paddingVertical: 4, paddingHorizontal: 4, fontSize: 9.76, lineHeight: 1.2, fontWeight: 700, color: "#ffffff", textAlign: "center", textTransform: "uppercase" },
  meetingGroup: { flexDirection: "row", borderBottom: "1 solid #e4edf6" },
  lastMeetingGroup: { borderBottomWidth: 0 },
  meetingDayCell: { width: "20%", alignSelf: "stretch", justifyContent: "center", alignItems: "center", paddingVertical: 3, paddingHorizontal: 4, borderRight: "1 solid #e4edf6" },
  meetingDay: { fontSize: 11.2, lineHeight: 1.25, fontWeight: 700, color: "#1c2430", textAlign: "center" },
  meetingSchedules: { flex: 1 },
  meetingScheduleRow: { flexDirection: "row", minHeight: 20, alignItems: "center" },
  meetingScheduleInnerRow: { borderBottom: "1 solid #e4edf6" },
  meetingValueCell: { flexGrow: 1, flexBasis: 0, paddingVertical: 3, paddingHorizontal: 4, fontSize: 11.2, lineHeight: 1.25, color: "#1c2430", opacity: 0.6, textAlign: "center", borderRight: "1 solid #e4edf6" },
  meetingLastValueCell: { borderRightWidth: 0 },
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

function Metric({ label, value, half = false, responsible = false }: { label: string; value: number; half?: boolean; responsible?: boolean }) {
  return <View style={[styles.metric, ...(responsible ? [styles.responsibleMetric] : []), ...(half ? [styles.metricHalf] : [])]} wrap={false}><Text style={responsible ? styles.responsibleMetricLabel : styles.metricLabel}>{label}</Text><Text style={responsible ? styles.responsibleMetricValue : styles.metricValue}>{formatNumber(value)}</Text></View>;
}

function FoundationDateMetric({ value }: { value: string }) {
  return <View style={[styles.metric, styles.responsibleMetric, styles.metricHalf]} wrap={false}><Text style={styles.responsibleMetricLabel}>Data de fundação do grupo</Text><Text style={styles.foundationDateValue}>{formatDate(value)}</Text></View>;
}

function Table({ headers, rows, repeatHeader = false, framed = false }: { headers: string[]; rows: string[][]; repeatHeader?: boolean; framed?: boolean }) {
  return (
    <View style={[styles.table, ...(framed ? [styles.tableFrame] : [])]}>
      <View style={[styles.row, styles.header]} fixed={repeatHeader} wrap={false}>
        {headers.map((header, index) => <Text key={header} style={[styles.cell, ...(framed ? [styles.framedCell] : []), ...(index === headers.length - 1 && framed ? [styles.lastCell] : [])]}>{header}</Text>)}
      </View>
      {rows.length ? rows.map((row, index) => (
        <View key={`${index}-${row.join("|")}`} style={[styles.row, ...(index === rows.length - 1 && framed ? [styles.lastRow] : [])]} wrap={false}>
          {row.map((cell, cellIndex) => <Text key={cellIndex} style={[styles.cell, ...(framed ? [styles.framedCell] : []), ...(framed && cellIndex === row.length - 1 ? [styles.lastCell] : [])]}>{cell}</Text>)}
        </View>
      )) : <View style={[styles.row, ...(framed ? [styles.lastRow] : [])]} wrap={false}><Text style={[styles.cell, ...(framed ? [styles.lastCell] : [])]}>Nenhum registro no período.</Text></View>}
    </View>
  );
}

const weekdayLabels: Record<string, string> = {
  domingo: "Domingo",
  segunda: "Segunda",
  terca: "Terça",
  quarta: "Quarta",
  quinta: "Quinta",
  sexta: "Sexta",
  sabado: "Sábado",
};

function MeetingScheduleTable({ data }: { data: MonthlyDashboardData }) {
  return (
    <View style={[styles.table, styles.tableFrame]}>
      <View style={styles.meetingHeader} fixed wrap={false}>
        <View style={[styles.meetingHeaderDay, styles.meetingHeaderSeparator]}><Text style={styles.meetingHeaderCell}>Dia da Semana</Text></View>
        <View style={styles.meetingHeaderDetails}>
          {["Horário", "Presenças", "Média", "Ingressos"].map((header, index, list) => (
            <Text key={header} style={[styles.meetingHeaderCell, ...(index < list.length - 1 ? [styles.framedCell] : [])]}>{header}</Text>
          ))}
        </View>
      </View>
      {data.responsavelMeetingResults.map((day, dayIndex, days) => {
        const schedules = day.schedules.length
          ? day.schedules
          : [{ time: "-", presences: day.presences, averagePresences: day.averagePresences, ingressos: day.ingressos }];
        const dayLabel = weekdayLabels[day.weekday.toLocaleLowerCase("pt-BR")] ?? day.weekday;
        return (
          <View key={day.weekday} style={[styles.meetingGroup, ...(dayIndex === days.length - 1 ? [styles.lastMeetingGroup] : [])]} wrap={false}>
            <View style={styles.meetingDayCell}><Text style={styles.meetingDay}>{dayLabel}</Text></View>
            <View style={styles.meetingSchedules}>
              {schedules.map((schedule, index) => (
                <View key={`${day.weekday}-${schedule.time}-${index}`} style={[styles.meetingScheduleRow, ...(index < schedules.length - 1 ? [styles.meetingScheduleInnerRow] : [])]}>
                  {[schedule.time, formatNumber(schedule.presences), formatNumber(schedule.averagePresences), formatNumber(schedule.ingressos)].map((value, cellIndex, values) => (
                    <Text key={cellIndex} style={[styles.meetingValueCell, ...(cellIndex < values.length - 1 ? [styles.framedCell] : []), ...(cellIndex === values.length - 1 ? [styles.meetingLastValueCell] : [])]}>{value}</Text>
                  ))}
                </View>
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function AchievementsGrid({ data }: { data: MonthlyDashboardData }) {
  return (
    <View style={styles.achievementGrid}>
      {data.achievements.rows.map((row) => (
        <View key={row.code} style={styles.achievementCard} wrap={false}>
          <View style={styles.achievementLabelLine}>
            <View style={[styles.achievementDot, { backgroundColor: row.color }]} />
            <Text style={styles.achievementLabel}>{row.label.toLocaleUpperCase("pt-BR")}</Text>
          </View>
          <Text style={styles.achievementValue}>{formatNumber(row.value)}</Text>
        </View>
      ))}
      <View style={styles.achievementCard} wrap={false}>
        <Text style={styles.achievementLabel}>TOTAL</Text>
        <Text style={styles.achievementValue}>{formatNumber(data.achievements.subtotal)}</Text>
      </View>
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

        {responsible ? <Section title="Servidores"><Table headers={["Encargo", "Nome", "Desde"]} rows={data.mesa.map((row) => [row.encargo, row.vacant ? "Vago" : row.nome || "-", formatDate(row.data_inicio)])} framed /></Section> : null}

        <Section title="Consolidado">
          {responsible ? (
            <>
              <View style={styles.foundationMetrics}>
                <Metric label="Reuniões desde a Fundação" value={data.consolidated.reunioesDesdeFundacao} half responsible />
                <FoundationDateMetric value={data.group.data_fundacao ?? ""} />
              </View>
              <View style={styles.responsibleMetrics}>{metrics.map(([label, value]) => <Metric key={label} label={label} value={value} responsible />)}</View>
            </>
          ) : <View style={styles.metrics}>{metrics.map(([label, value]) => <Metric key={label} label={label} value={value} />)}</View>}
        </Section>

        {responsible ? (
          <Section title="Consolidados por Reunião Semanal">
            <MeetingScheduleTable data={data} />
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
          {responsible ? <AchievementsGrid data={data} /> : <Table headers={["Conquista", "Total"]} rows={[
            [data.achievements.ingresso.label, formatNumber(data.achievements.ingresso.value)],
            ...data.achievements.rows.map((row) => [row.label, formatNumber(row.value)]),
            ["Subtotal", formatNumber(data.achievements.subtotal)],
            ["Total", formatNumber(data.achievements.total)],
          ]} />}
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
