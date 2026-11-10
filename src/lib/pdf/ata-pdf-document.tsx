import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import path from "node:path";
import type { ReactNode } from "react";
import type { AtaPresentation } from "@/app/atas/ata-presentation";
import { formatReviewDate } from "@/app/atas/nova/ata-review";

Font.register({
  family: "Noto Sans",
  fonts: [
    { src: path.join(process.cwd(), "public/fonts/NotoSans-Regular.ttf"), fontWeight: 400 },
    { src: path.join(process.cwd(), "public/fonts/NotoSans-Bold.ttf"), fontWeight: 700 },
  ],
});

const colors = {
  brand: "#1d4ed8",
  title: "#0b3a7a",
  ink: "#1c2430",
  muted: "#6e849a",
  line: "#dfe3e8",
  rowLine: "#e4edf6",
  detailHeader: "#e6f1fa",
  paper: "#fcfdff",
  white: "#ffffff",
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingHorizontal: 32,
    paddingBottom: 34,
    fontFamily: "Noto Sans",
    fontSize: 8,
    color: colors.ink,
    backgroundColor: colors.paper,
  },
  title: { marginBottom: 14, fontSize: 17, fontWeight: 700, color: colors.title },
  section: {
    marginBottom: 12,
    border: `1 solid ${colors.line}`,
    borderRadius: 8,
    padding: 10,
    backgroundColor: colors.white,
  },
  heading: { marginBottom: 6, fontSize: 11, fontWeight: 700, color: colors.ink },
  detailCard: {
    marginBottom: 12,
    border: `1 solid ${colors.line}`,
    borderRadius: 9,
    padding: 9,
    backgroundColor: colors.white,
  },
  detailCardTitle: { marginBottom: 10, fontSize: 13, fontWeight: 700, color: "#000000" },
  detailSubsection: { marginBottom: 12 },
  detailSubsectionLast: { marginBottom: 0 },
  detailSubsectionTitle: {
    marginBottom: 5,
    fontSize: 10,
    lineHeight: 1.25,
    fontWeight: 700,
    color: colors.title,
  },
  infoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  infoCard: {
    width: "49%",
    minHeight: 42,
    border: `1 solid ${colors.line}`,
    borderRadius: 8,
    padding: 8,
    backgroundColor: colors.white,
  },
  infoCardFull: { width: "100%" },
  infoLabel: { fontSize: 8.25, lineHeight: 1.2, color: colors.muted },
  infoValue: { marginTop: 3, fontSize: 10, lineHeight: 1.25, fontWeight: 700, color: colors.ink },
  metrics: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  metricCard: {
    width: "32%",
    minHeight: 54,
    border: `1 solid ${colors.line}`,
    borderRadius: 9,
    padding: 9,
    backgroundColor: colors.white,
  },
  metricLabel: { fontSize: 8.25, lineHeight: 1.2, color: colors.muted },
  metricValue: { marginTop: 3, fontSize: 22.5, lineHeight: 1, fontWeight: 700, color: colors.brand },
  table: { width: "100%", border: `1 solid ${colors.rowLine}`, borderRadius: 8, overflow: "hidden" },
  tableHeader: {
    minHeight: 22,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.detailHeader,
  },
  tableHeaderCell: {
    paddingVertical: 4,
    paddingHorizontal: 5,
    color: colors.title,
    fontSize: 7.5,
    lineHeight: 1.2,
    fontWeight: 700,
    textTransform: "uppercase",
  },
  tableRow: {
    minHeight: 20,
    flexDirection: "row",
    alignItems: "center",
    borderBottom: `1 solid ${colors.rowLine}`,
  },
  lastTableRow: { borderBottomWidth: 0 },
  tableCell: { paddingVertical: 4, paddingHorizontal: 5, fontSize: 8, lineHeight: 1.2, color: colors.ink },
  emptyTableRow: { minHeight: 28, justifyContent: "center", paddingHorizontal: 5 },
  emptyTableText: { color: colors.muted, fontSize: 8, textAlign: "center" },
  footer: {
    position: "absolute",
    bottom: 16,
    left: 32,
    right: 32,
    textAlign: "right",
    color: colors.muted,
    fontSize: 7,
  },
});

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function InfoCard({
  label,
  value,
  full = false,
}: {
  label: string;
  value: string;
  full?: boolean;
}) {
  return (
    <View style={[styles.infoCard, ...(full ? [styles.infoCardFull] : [])]} wrap={false}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || "-"}</Text>
    </View>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.metricCard} wrap={false}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{formatNumber(value)}</Text>
    </View>
  );
}

function Section({ title, children, breakBefore = false }: { title: string; children: ReactNode; breakBefore?: boolean }) {
  return (
    <View style={styles.section} break={breakBefore}>
      <Text style={styles.heading}>{title}</Text>
      {children}
    </View>
  );
}

function Table({
  headers,
  rows,
  widths,
  alignments,
  emptyMessage = "Nenhum registro.",
}: {
  headers: string[];
  rows: string[][];
  widths: string[];
  alignments: ("left" | "center")[];
  emptyMessage?: string;
}) {
  return (
    <View style={styles.table}>
      <View style={styles.tableHeader} fixed wrap={false}>
        {headers.map((header, index) => (
          <Text key={header} style={[styles.tableHeaderCell, { width: widths[index], textAlign: "center" }]}>
            {header}
          </Text>
        ))}
      </View>
      {rows.length ? rows.map((row, rowIndex) => (
        <View
          key={`${rowIndex}-${row.join("-")}`}
          style={[
            styles.tableRow,
            ...(rowIndex === rows.length - 1 ? [styles.lastTableRow] : []),
          ]}
          wrap={false}
        >
          {row.map((cell, index) => (
            <Text key={`${index}-${cell}`} style={[styles.tableCell, { width: widths[index], textAlign: alignments[index] }]}>
              {cell}
            </Text>
          ))}
        </View>
      )) : (
        <View style={styles.emptyTableRow} wrap={false}>
          <Text style={styles.emptyTableText}>{emptyMessage}</Text>
        </View>
      )}
    </View>
  );
}

export function AtaPdfDocument({ presentation, generatedAt }: { presentation: AtaPresentation; generatedAt: Date }) {
  const data = presentation.reviewData;
  const additionalInformation = data.additionalInformation?.filter(
    (item) => item.label !== "Formato outros",
  ) ?? [];
  const formattedGeneratedAt = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
    timeZone: "America/Sao_Paulo",
  }).format(generatedAt);
  const metrics = [
    ["Servidores", data.servers.length],
    ["Membros", data.membersPresent],
    ["Partilhas", data.shares],
    ["Visitantes", data.visitors.length],
    ["Ingressos", data.admissions.length],
    ["Conquistas", data.achievements.length],
    ["Cidades", data.supplementalMetrics?.cities ?? data.locations.length],
    ["Estados", data.supplementalMetrics?.states ?? 0],
    ["Outros Países", data.supplementalMetrics?.otherCountries ?? data.internationalMembers.length],
  ] as const;

  const achievementTotals = new Map<string, number>();
  data.achievements.forEach((item) => {
    achievementTotals.set(item.time, (achievementTotals.get(item.time) ?? 0) + 1);
  });

  const detailSections: {
    title: string;
    headers: string[];
    widths: string[];
    alignments: ("left" | "center")[];
    rows: string[][];
    emptyMessage: string;
  }[] = [
    {
      title: "Localidades Nacionais",
      headers: ["Cidade", "Total"],
      widths: ["74%", "26%"],
      alignments: ["left", "center"],
      rows: data.locations.map((item, index) => [
        `${index + 1}. ${item.name}${item.detail ? `\n${item.detail}` : ""}`,
        String(item.count),
      ]),
      emptyMessage: "Nenhuma localidade nacional registrada.",
    },
    {
      title: "Servidores",
      headers: ["Servidor", "Função"],
      widths: ["58%", "42%"],
      alignments: ["left", "center"],
      rows: data.servers.map((item, index) => [`${index + 1}. ${item.name}`, item.role || "-"]),
      emptyMessage: "Nenhum servidor registrado.",
    },
    {
      title: "Localidades Internacionais",
      headers: ["País", "Total"],
      widths: ["74%", "26%"],
      alignments: ["left", "center"],
      rows: data.internationalMembers.map((item, index) => [`${index + 1}. ${item.country}`, String(item.count)]),
      emptyMessage: "Nenhuma localidade internacional registrada.",
    },
    {
      title: "Visitantes",
      headers: ["Cidade", "Categoria", "Origem"],
      widths: ["40%", "30%", "30%"],
      alignments: ["left", "center", "center"],
      rows: data.visitors.map((item, index) => [
        `${index + 1}. ${item.city}`,
        item.category,
        item.origin,
      ]),
      emptyMessage: "Nenhum visitante registrado.",
    },
    {
      title: "Ingressos",
      headers: ["Cidade", "Estado"],
      widths: ["68%", "32%"],
      alignments: ["left", "center"],
      rows: data.admissions.map((item, index) => [`${index + 1}. ${item.city}`, item.state]),
      emptyMessage: "Nenhum ingresso registrado.",
    },
    {
      title: "Conquistas",
      headers: ["Tempo", "Total"],
      widths: ["64%", "36%"],
      alignments: ["left", "center"],
      rows: [...achievementTotals].map(([time, total], index) => [`${index + 1}. ${time}`, String(total)]),
      emptyMessage: "Nenhuma conquista registrada.",
    },
  ];

  return (
    <Document title={presentation.title} author="GS Mapeamento" subject="Ata de Reunião confirmada">
      <Page size="A4" style={styles.page} wrap>
        <Text style={styles.title}>{presentation.title} - Grupo {data.group}</Text>

        <Section title="Dados da reunião">
          <View style={styles.infoGrid}>
            <InfoCard label="Grupo" value={data.group} full />
            <InfoCard label="Data" value={formatReviewDate(data.date)} />
            <InfoCard label="Horário" value={data.time} />
            <InfoCard label="Tipo" value={data.meetingType} />
            <InfoCard label="Plataforma" value={data.platform} />
            <InfoCard label="Formatos" value={data.formats} />
            {additionalInformation.map((item) => (
              <InfoCard key={item.label} label={item.label} value={item.value} />
            ))}
          </View>
        </Section>

        <Section title="Consolidado">
          <View style={styles.metrics}>
            {metrics.map(([label, value]) => <MetricCard key={label} label={label} value={value} />)}
          </View>
        </Section>

        <View style={styles.detailCard}>
          <Text style={styles.detailCardTitle} minPresenceAhead={60}>
            Detalhamento
          </Text>
          {detailSections.map((section, index) => (
            <View
              key={section.title}
              style={[
                styles.detailSubsection,
                ...(index === detailSections.length - 1 ? [styles.detailSubsectionLast] : []),
              ]}
            >
              <Text style={styles.detailSubsectionTitle} minPresenceAhead={48}>
                {section.title}
              </Text>
              <Table
                headers={section.headers}
                widths={section.widths}
                alignments={section.alignments}
                rows={section.rows}
                emptyMessage={section.emptyMessage}
              />
            </View>
          ))}
        </View>

        <Text
          style={styles.footer}
          fixed
          render={({ pageNumber, totalPages }) => (
            `GS Mapeamento · Gerado em ${formattedGeneratedAt}${totalPages > 1 ? ` · Página ${pageNumber} de ${totalPages}` : ""}`
          )}
        />
      </Page>
    </Document>
  );
}

export async function renderAtaPdf(presentation: AtaPresentation, generatedAt = new Date()) {
  return renderToBuffer(<AtaPdfDocument presentation={presentation} generatedAt={generatedAt} />);
}
