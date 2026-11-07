import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faCalendarDays,
  faClock,
  faComments,
  faDesktop,
  faFileCircleCheck,
  faFolder,
  faGlobe,
  faLocationDot,
  faTableCellsLarge,
  faTicket,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import {
  Document,
  Page,
  Path,
  StyleSheet,
  Svg,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { ReactNode } from "react";
import type { AtaPresentation } from "@/app/atas/ata-presentation";
import { buildAtaDetailColumnLayout, type AtaDetailSectionKey } from "@/app/atas/ata-detail-column-layout";
import { formatReviewDate } from "@/app/atas/nova/ata-review";

const colors = {
  brand: "#1D4ED8",
  brandSoft: "#E6F1FA",
  ink: "#1C2430",
  muted: "#6E849A",
  quiet: "#6E849A",
  line: "#DFE3E8",
  rowLine: "#E4EDF6",
  paper: "#FCFDFF",
  white: "#FFFFFF",
};

const recordRowMinHeight = 13.5;

const styles = StyleSheet.create({
  page: {
    paddingTop: 18,
    paddingRight: 24,
    paddingBottom: 24,
    paddingLeft: 24,
    backgroundColor: colors.paper,
    color: colors.ink,
    fontFamily: "Helvetica",
    fontSize: 6.4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  headerIcon: {
    width: 27,
    height: 27,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.brandSoft,
  },
  headerTitle: {
    marginLeft: 8,
    color: colors.ink,
    fontSize: 15,
    fontWeight: 700,
  },
  footer: {
    position: "absolute",
    right: 24,
    bottom: 10,
    left: 24,
    color: colors.muted,
    fontSize: 5.8,
    textAlign: "right",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -2,
  },
  infoCard: {
    width: "50%",
    paddingHorizontal: 2,
    paddingBottom: 4,
  },
  infoCardGroup: { width: "100%" },
  infoCardInner: {
    minHeight: 27,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 5,
    paddingVertical: 4,
    paddingHorizontal: 5,
    backgroundColor: colors.white,
  },
  infoIcon: {
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    backgroundColor: colors.brandSoft,
  },
  infoText: { flexGrow: 1, flexBasis: 0, marginLeft: 5 },
  label: { color: colors.muted, fontSize: 5.7 },
  value: { marginTop: 1, color: colors.ink, fontSize: 7.5, fontWeight: 700 },
  additionalCard: {
    width: "50%",
    paddingHorizontal: 2,
    paddingBottom: 4,
  },
  additionalCardInner: {
    minHeight: 25,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 5,
    paddingVertical: 4,
    paddingHorizontal: 6,
    backgroundColor: colors.white,
  },
  metrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 1,
    marginHorizontal: -2,
  },
  metricCard: { width: "33.333%", paddingHorizontal: 2, paddingBottom: 4 },
  metricCardInner: {
    minHeight: 29,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 5,
    paddingVertical: 4,
    paddingHorizontal: 5,
    backgroundColor: colors.white,
  },
  metricText: { flexGrow: 1, flexBasis: 0, marginLeft: 5 },
  metricLabel: { color: colors.muted, fontSize: 5.5, fontWeight: 700 },
  metricValue: { marginTop: 1, color: colors.ink, fontSize: 10.5, fontWeight: 700 },
  sections: { marginTop: 1 },
  sectionColumns: { flexDirection: "row", alignItems: "flex-start", marginHorizontal: -3 },
  sectionColumn: { width: "50%", paddingHorizontal: 3 },
  section: {
    marginBottom: 5,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 5,
    backgroundColor: colors.white,
  },
  sectionHeader: {
    minHeight: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.rowLine,
    paddingVertical: 2,
    paddingHorizontal: 5,
  },
  sectionHeading: { flexDirection: "row", alignItems: "center", flexGrow: 1, flexBasis: 0 },
  sectionIcon: {
    width: 15,
    height: 15,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: colors.brandSoft,
  },
  sectionTitle: { marginLeft: 4, color: colors.ink, fontSize: 6.8, fontWeight: 700 },
  count: {
    minWidth: 15,
    borderRadius: 4,
    paddingVertical: 1.5,
    paddingHorizontal: 4,
    backgroundColor: colors.brandSoft,
    color: colors.brand,
    fontSize: 5.8,
    fontWeight: 700,
    textAlign: "center",
  },
  tableHeader: { flexDirection: "row", backgroundColor: colors.brandSoft },
  tableHeaderCell: {
    paddingVertical: 3,
    paddingHorizontal: 3,
    color: colors.brand,
    fontSize: 5.1,
    fontWeight: 700,
  },
  tableRow: {
    minHeight: recordRowMinHeight,
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: colors.rowLine,
  },
  tableCell: { paddingVertical: 3, paddingHorizontal: 3, fontSize: 5.6, lineHeight: 1.15 },
  emptyTableRow: {
    minHeight: 24,
    justifyContent: "center",
    borderTopWidth: 1,
    borderTopColor: colors.rowLine,
    paddingHorizontal: 5,
  },
  emptyTableText: { color: colors.quiet, fontSize: 5.8, textAlign: "center" },
});

function PdfIcon({ icon, size = 9 }: { icon: IconDefinition; size?: number }) {
  const [width, height, , , pathData] = icon.icon;
  const path = Array.isArray(pathData) ? pathData.join(" ") : pathData;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${width} ${height}`}>
      <Path d={path} fill={colors.brand} />
    </Svg>
  );
}

function InfoCard({
  icon,
  label,
  value,
  group = false,
}: {
  icon: IconDefinition;
  label: string;
  value: string;
  group?: boolean;
}) {
  return (
    <View style={[styles.infoCard, ...(group ? [styles.infoCardGroup] : [])]} wrap={false}>
      <View style={styles.infoCardInner}>
        <View style={styles.infoIcon}><PdfIcon icon={icon} size={8} /></View>
        <View style={styles.infoText}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.value}>{value}</Text>
        </View>
      </View>
    </View>
  );
}

function MetricCard({ icon, label, value }: { icon: IconDefinition; label: string; value: number }) {
  return (
    <View style={styles.metricCard} wrap={false}>
      <View style={styles.metricCardInner}>
        <View style={styles.infoIcon}><PdfIcon icon={icon} size={8} /></View>
        <View style={styles.metricText}>
          <Text style={styles.metricLabel}>{label}</Text>
          <Text style={styles.metricValue}>{value}</Text>
        </View>
      </View>
    </View>
  );
}

function Section({
  icon,
  title,
  count,
  children,
}: {
  icon: IconDefinition;
  title: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader} wrap={false}>
        <View style={styles.sectionHeading}>
          <View style={styles.sectionIcon}><PdfIcon icon={icon} size={7} /></View>
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <Text style={styles.count}>{count}</Text>
      </View>
      {children}
    </View>
  );
}

function Table({ headers, rows, widths, emptyMessage = "Nenhum registro." }: { headers: string[]; rows: string[][]; widths: string[]; emptyMessage?: string }) {
  return (
    <View>
      <View style={styles.tableHeader} wrap={false}>
        {headers.map((header, index) => (
          <Text key={header} style={[styles.tableHeaderCell, { width: widths[index] }]}>{header}</Text>
        ))}
      </View>
      {rows.length ? rows.map((row, rowIndex) => (
          <View key={`${rowIndex}-${row.join("-")}`} style={styles.tableRow} wrap={false}>
            {row.map((cell, index) => (
              <Text key={`${index}-${cell}`} style={[styles.tableCell, { width: widths[index] }]}>{cell}</Text>
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
    [faUsers, "Servidores", data.servers.length],
    [faUsers, "Membros", data.membersPresent],
    [faComments, "Partilhas", data.shares],
    [faUsers, "Visitantes", data.visitors.length],
    [faTicket, "Ingressos", data.admissions.length],
    [faClock, "Conquistas", data.achievements.length],
    [faLocationDot, "Cidades", data.supplementalMetrics?.cities ?? data.locations.length],
    [faLocationDot, "Estados", data.supplementalMetrics?.states ?? 0],
    [faGlobe, "Outros Países", data.supplementalMetrics?.otherCountries ?? data.internationalMembers.length],
  ] as const;
  const detailColumnLayout = buildAtaDetailColumnLayout(data);
  const detailSections: Record<AtaDetailSectionKey, ReactNode> = {
    servers: (
      <Section icon={faUsers} title="Servidores" count={data.servers.length}>
        <Table
          headers={["Servidores", "Função"]}
          widths={["70%", "30%"]}
          rows={data.servers.map((item, index) => [`${index + 1}. ${item.name}`, item.role || "—"])}
          emptyMessage="Nenhum servidor registrado."
        />
      </Section>
    ),
    international: (
      <Section icon={faGlobe} title="Localidades Internacionais" count={data.internationalMembers.length}>
        <Table
          headers={["Localidades Internacionais", "Total"]}
          widths={["80%", "20%"]}
          rows={data.internationalMembers.map((item, index) => [`${index + 1}. ${item.country}`, String(item.count)])}
          emptyMessage="Nenhuma localidade internacional registrada."
        />
      </Section>
    ),
    visitors: (
      <Section icon={faUsers} title="Visitantes" count={data.visitors.length}>
        <Table
          headers={["Visitante", "Cidade", "Categoria", "Origem"]}
          widths={["30%", "24%", "23%", "23%"]}
          rows={data.visitors.map((item, index) => [
            `${index + 1}. ${item.label}`,
            item.city,
            item.category,
            item.origin,
          ])}
          emptyMessage="Nenhum visitante registrado."
        />
      </Section>
    ),
    admissions: (
      <Section icon={faTicket} title="Ingressos" count={data.admissions.length}>
        <Table
          headers={["Ingresso", "Cidade", "Estado"]}
          widths={["42%", "32%", "26%"]}
          rows={data.admissions.map((item, index) => [
            `${index + 1}. ${item.label}`,
            item.city,
            item.state,
          ])}
          emptyMessage="Nenhum ingresso registrado."
        />
      </Section>
    ),
    achievements: (
      <Section icon={faClock} title="Conquistas" count={data.achievements.length}>
        <Table
          headers={["Conquista", "Tempo"]}
          widths={["64%", "36%"]}
          rows={data.achievements.map((item, index) => [`${index + 1}. ${item.label}`, item.time])}
          emptyMessage="Nenhuma conquista registrada."
        />
      </Section>
    ),
  };

  return (
    <Document title={presentation.title} author="GS Mapeamento" subject="Ata de Reunião confirmada">
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.header} wrap={false}>
          <View style={styles.headerIcon}><PdfIcon icon={faFileCircleCheck} size={13} /></View>
          <Text style={styles.headerTitle}>{presentation.title}</Text>
        </View>

        <View style={styles.grid}>
          <InfoCard icon={faUsers} label="Grupo" value={data.group} group />
          <InfoCard icon={faCalendarDays} label="Data" value={formatReviewDate(data.date)} />
          <InfoCard icon={faClock} label="Horário" value={data.time} />
          <InfoCard icon={faFolder} label="Tipo" value={data.meetingType} />
          <InfoCard icon={faDesktop} label="Plataforma" value={data.platform} />
          <InfoCard icon={faTableCellsLarge} label="Formatos" value={data.formats} />
          {additionalInformation.map((entry) => (
            <View key={entry.label} style={styles.additionalCard} wrap={false}>
              <View style={styles.additionalCardInner}>
                <Text style={styles.label}>{entry.label}</Text>
                <Text style={styles.value}>{entry.value}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.metrics}>
          {metrics.map(([icon, label, value]) => (
            <MetricCard key={label} icon={icon} label={label} value={value} />
          ))}
        </View>

        <View style={styles.sections}>
          <View style={styles.sectionColumns}>
            <View style={styles.sectionColumn}>
              <Section icon={faLocationDot} title="Localidades Nacionais" count={data.locations.length}>
                <Table
                  headers={["Localidades Nacionais", "Total"]}
                  widths={["82%", "18%"]}
                  rows={data.locations.map((item, index) => [
                    `${index + 1}. ${item.name}${item.detail ? `\n${item.detail}` : ""}`,
                    String(item.count),
                  ])}
                  emptyMessage="Nenhuma localidade nacional registrada."
                />
              </Section>
              {detailColumnLayout.left.map((key) => <View key={key}>{detailSections[key]}</View>)}
            </View>
            <View style={styles.sectionColumn}>
              {detailColumnLayout.right.map((key) => <View key={key}>{detailSections[key]}</View>)}
            </View>
          </View>
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
