import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { ReactNode } from "react";
import type { AtaPresentation } from "@/app/atas/ata-presentation";
import { formatReviewDate } from "@/app/atas/nova/ata-review";

const colors = {
  brand: "#007A55",
  brandSoft: "#EAF5EF",
  ink: "#10291F",
  muted: "#52645C",
  line: "#DDE6E1",
  paper: "#FBFAF4",
  white: "#FFFFFF",
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingRight: 32,
    paddingBottom: 42,
    paddingLeft: 32,
    backgroundColor: colors.paper,
    color: colors.ink,
    fontFamily: "Helvetica",
    fontSize: 8.5,
  },
  continuationHeader: {
    position: "absolute",
    top: 18,
    right: 32,
    left: 32,
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingBottom: 6,
    color: colors.muted,
    fontSize: 7.5,
  },
  footer: {
    position: "absolute",
    right: 32,
    bottom: 18,
    left: 32,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 6,
    color: colors.muted,
    fontSize: 7,
  },
  hero: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    padding: 12,
    backgroundColor: colors.white,
  },
  heroTitle: { color: colors.brand, fontSize: 18, fontWeight: 700 },
  heroMeta: { marginTop: 3, color: colors.muted, fontSize: 7.5 },
  heroBadge: {
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: colors.brandSoft,
    color: colors.brand,
    fontSize: 8,
    fontWeight: 700,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -3 },
  infoCard: {
    width: "50%",
    paddingHorizontal: 3,
    paddingBottom: 6,
  },
  infoCardInner: {
    minHeight: 39,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 6,
    padding: 7,
    backgroundColor: colors.white,
  },
  label: { color: colors.muted, fontSize: 6.8, fontWeight: 700 },
  value: { marginTop: 2, color: colors.ink, fontSize: 9, fontWeight: 700 },
  section: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 7,
    backgroundColor: colors.white,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingVertical: 7,
    paddingHorizontal: 9,
  },
  sectionTitle: { color: colors.ink, fontSize: 10, fontWeight: 700 },
  count: {
    borderRadius: 5,
    paddingVertical: 2,
    paddingHorizontal: 5,
    backgroundColor: colors.brandSoft,
    color: colors.brand,
    fontSize: 7,
    fontWeight: 700,
  },
  metrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 7,
    backgroundColor: colors.white,
  },
  metric: { width: "33.33%", alignItems: "center", paddingVertical: 8, paddingHorizontal: 2 },
  metricBorder: { borderLeftWidth: 1, borderLeftColor: colors.line },
  metricBorderTop: { borderTopWidth: 1, borderTopColor: colors.line },
  metricLabel: { minHeight: 16, color: colors.muted, fontSize: 6.2, textAlign: "center" },
  metricValue: { marginTop: 2, color: colors.brand, fontSize: 12, fontWeight: 700 },
  supplemental: { flexDirection: "row", marginTop: 6, marginHorizontal: -3 },
  supplementalItem: { width: "33.333%", paddingHorizontal: 3 },
  supplementalInner: {
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 6,
    padding: 6,
    backgroundColor: colors.white,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#EDF1EF",
    paddingVertical: 5,
    paddingHorizontal: 9,
  },
  rowText: { flexGrow: 1, flexBasis: 0, paddingRight: 8 },
  badge: { borderRadius: 4, paddingVertical: 2, paddingHorizontal: 5, backgroundColor: colors.brandSoft, color: colors.brand, fontSize: 6.8 },
  empty: { padding: 12, color: colors.muted, textAlign: "center", fontStyle: "italic" },
  tableHeader: { flexDirection: "row", backgroundColor: colors.brandSoft },
  tableHeaderCell: { paddingVertical: 5, paddingHorizontal: 6, color: colors.brand, fontSize: 6.5, fontWeight: 700 },
  tableRow: { flexDirection: "row", borderTopWidth: 1, borderTopColor: "#EDF1EF" },
  tableCell: { paddingVertical: 5, paddingHorizontal: 6, fontSize: 7.2 },
  identification: { flexDirection: "row", padding: 8 },
  identificationItem: { flexGrow: 1, flexBasis: 0, paddingHorizontal: 4 },
});

function Section({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return (
    <View style={styles.section} wrap={false}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.count}>{count}</Text>
      </View>
      {children}
    </View>
  );
}

function chunks<T>(items: T[], size: number) {
  if (!items.length) return [[]] as T[][];
  return Array.from(
    { length: Math.ceil(items.length / size) },
    (_, index) => items.slice(index * size, (index + 1) * size),
  );
}

function Empty({ children }: { children: string }) {
  return <Text style={styles.empty}>{children}</Text>;
}

function Table({ headers, rows, widths }: { headers: string[]; rows: string[][]; widths: string[] }) {
  if (!rows.length) return <Empty>Nenhum registro.</Empty>;
  return (
    <View>
      <View style={styles.tableHeader} fixed>
        {headers.map((header, index) => <Text key={header} style={[styles.tableHeaderCell, { width: widths[index] }]}>{header}</Text>)}
      </View>
      {rows.map((row, rowIndex) => (
        <View key={`${rowIndex}-${row.join("-")}`} style={styles.tableRow} wrap={false}>
          {row.map((cell, index) => <Text key={`${index}-${cell}`} style={[styles.tableCell, { width: widths[index] }]}>{cell}</Text>)}
        </View>
      ))}
    </View>
  );
}

export function AtaPdfDocument({ presentation, generatedAt }: { presentation: AtaPresentation; generatedAt: Date }) {
  const data = presentation.reviewData;
  const info = [
    ["Grupo", data.group],
    ["Data e hora", `${formatReviewDate(data.date)} às ${data.time}`],
    ["Preenchido por", data.filledBy],
    ["Plataforma", data.platform],
    ["Tipo", data.meetingType],
    ["Formatos", data.formats],
    ["Membros presentes", String(data.membersPresent)],
    ["Partilhas", String(data.shares)],
    ...(data.additionalInformation ?? []).map((entry) => [entry.label, entry.value]),
  ];
  const metrics = [
    ["Servidores", data.servers.length],
    ["Membros", data.membersPresent],
    ["Partilhas", data.shares],
    ["Visitantes", data.visitors.length],
    ["Ingressos", data.admissions.length],
    ["Conquistas", data.achievements.length],
    ["Cidades", data.supplementalMetrics?.cities ?? data.locations.length],
    ["Estados", data.supplementalMetrics?.states ?? 0],
    ["Outros países", data.supplementalMetrics?.otherCountries ?? data.internationalMembers.length],
  ] as const;
  const formattedGeneratedAt = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
    timeZone: "America/Sao_Paulo",
  }).format(generatedAt);

  return (
    <Document title={presentation.title} author="GS Mapeamento" subject="Ata de reunião confirmada">
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.continuationHeader} fixed>
          <Text>{presentation.title}</Text>
          <Text>GS Mapeamento</Text>
        </View>
        <View style={styles.hero} wrap={false}>
          <View>
            <Text style={styles.heroTitle}>{presentation.title}</Text>
            <Text style={styles.heroMeta}>Gerado em: {formattedGeneratedAt}</Text>
          </View>
          <Text style={styles.heroBadge}>ATA CONFIRMADA</Text>
        </View>

        <View style={styles.grid}>
          {info.map(([label, value]) => (
            <View key={label} style={styles.infoCard} wrap={false}>
              <View style={styles.infoCardInner}>
                <Text style={styles.label}>{label}</Text>
                <Text style={styles.value}>{value}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section} wrap={false}>
          <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Índice personalizado do grupo</Text></View>
          <View style={styles.identification}>
            {[
              ["Número da ata", presentation.groupReference],
            ].map(([label, value]) => (
              <View key={label} style={styles.identificationItem}>
                <Text style={styles.label}>{label}</Text><Text style={styles.value}>{value}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.metrics} wrap={false}>
          {metrics.map(([label, value], index) => (
            <View key={label} style={[styles.metric, ...(index % 3 ? [styles.metricBorder] : []), ...(index >= 3 ? [styles.metricBorderTop] : [])]}>
              <Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{value}</Text>
            </View>
          ))}
        </View>

        {chunks(data.servers, 10).map((items, chunkIndex) => (
          <Section key={`servers-${chunkIndex}`} title="Servidores" count={data.servers.length}>
            {items.length ? items.map((item, index) => (
              <View key={item.id} style={styles.row} wrap={false}>
                <Text style={styles.rowText}>{chunkIndex * 10 + index + 1}. {item.name}</Text>
                {item.role ? <Text style={styles.badge}>{item.role}</Text> : null}
              </View>
            )) : <Empty>Nenhum servidor registrado.</Empty>}
          </Section>
        ))}

        {chunks(data.locations, 10).map((items, chunkIndex) => (
          <Section key={`locations-${chunkIndex}`} title="Localidades" count={data.locations.length}>
            {items.length ? items.map((item, index) => (
              <View key={item.id} style={styles.row} wrap={false}>
                <Text style={styles.rowText}>{chunkIndex * 10 + index + 1}. {item.name}</Text><Text style={styles.badge}>{item.count}</Text>
              </View>
            )) : <Empty>Nenhuma localidade registrada.</Empty>}
          </Section>
        ))}

        {chunks(data.internationalMembers, 10).map((items, chunkIndex) => (
          <Section key={`international-${chunkIndex}`} title="Membros internacionais" count={data.internationalMembers.length}>
            {items.length ? items.map((item, index) => (
              <View key={item.id} style={styles.row} wrap={false}>
                <Text style={styles.rowText}>{chunkIndex * 10 + index + 1}. {item.country}</Text><Text style={styles.badge}>{item.count}</Text>
              </View>
            )) : <Empty>Nenhum membro internacional registrado.</Empty>}
          </Section>
        ))}

        {chunks(data.visitors, 10).map((items, chunkIndex) => (
          <Section key={`visitors-${chunkIndex}`} title="Visitantes" count={data.visitors.length}>
            <Table headers={["Visitante", "Cidade", "Categoria", "Origem"]} widths={["16%", "29%", "22%", "33%"]}
              rows={items.map((item) => [item.label, item.city, item.category, item.origin])} />
          </Section>
        ))}

        {chunks(data.admissions, 10).map((items, chunkIndex) => (
          <Section key={`admissions-${chunkIndex}`} title="Ingressos" count={data.admissions.length}>
            <Table headers={["Ingresso", "Cidade", "Estado"]} widths={["22%", "58%", "20%"]}
              rows={items.map((item) => [item.label, item.city, item.state])} />
          </Section>
        ))}

        {chunks(data.achievements, 10).map((items, chunkIndex) => (
          <Section key={`achievements-${chunkIndex}`} title="Conquistas de tempo" count={data.achievements.length}>
            <Table headers={["Conquista", "Tempo"]} widths={["50%", "50%"]}
              rows={items.map((item) => [item.label, item.time])} />
          </Section>
        ))}

        <View style={styles.footer} fixed>
          <Text>{presentation.title}</Text>
          <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

export async function renderAtaPdf(presentation: AtaPresentation, generatedAt = new Date()) {
  return renderToBuffer(<AtaPdfDocument presentation={presentation} generatedAt={generatedAt} />);
}
