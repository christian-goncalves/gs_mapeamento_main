import type { AtaReviewLayoutData } from "./ata-review-layout";

export type AtaDetailSectionKey =
  | "servers"
  | "international"
  | "visitors"
  | "admissions"
  | "achievements";

export type AtaDetailColumnLayout = {
  left: AtaDetailSectionKey[];
  right: AtaDetailSectionKey[];
};

function wrappedLines(value: string, columnShare: number) {
  const charactersPerLine = Math.max(8, 42 * columnShare);
  return Math.max(1, Math.ceil(value.length / charactersPerLine));
}

function tableHeight(headers: string[], rows: string[][], shares: number[]) {
  const headerHeight = Math.max(
    1,
    ...headers.map((header, index) => wrappedLines(header, shares[index])),
  );
  const rowHeights = rows.length
    ? rows.map((row) => Math.max(
        1,
        ...row.map((cell, index) => wrappedLines(cell, shares[index])),
      ))
    : [1];

  return headerHeight + rowHeights.reduce((total, height) => total + height, 0);
}

function sectionHeight(title: string, table: number) {
  return 1 + wrappedLines(title, 1) + table;
}

function getSectionHeights(data: AtaReviewLayoutData): Record<AtaDetailSectionKey, number> {
  return {
    servers: sectionHeight(
      "Servidores",
      tableHeight(
        ["Servidores", "Função"],
        data.servers.map((item, index) => [`${index + 1}. ${item.name}`, item.role || "—"]),
        [0.72, 0.28],
      ),
    ),
    international: sectionHeight(
      "Localidades Internacionais",
      tableHeight(
        ["Localidades Internacionais", "Total"],
        data.internationalMembers.map((item, index) => [`${index + 1}. ${item.country}`, String(item.count)]),
        [0.8, 0.2],
      ),
    ),
    visitors: sectionHeight(
      "Visitantes",
      tableHeight(
        ["Visitante", "Cidade", "Categoria", "Origem"],
        data.visitors.map((item, index) => [
          `${index + 1}. ${item.label}`,
          item.city,
          item.category,
          item.origin,
        ]),
        [0.3, 0.24, 0.23, 0.23],
      ),
    ),
    admissions: sectionHeight(
      "Ingressos",
      tableHeight(
        ["Ingresso", "Cidade", "Estado"],
        data.admissions.map((item, index) => [`${index + 1}. ${item.label}`, item.city, item.state]),
        [0.42, 0.32, 0.26],
      ),
    ),
    achievements: sectionHeight(
      "Conquistas",
      tableHeight(
        ["Conquista", "Tempo"],
        data.achievements.map((item, index) => [`${index + 1}. ${item.label}`, item.time]),
        [0.64, 0.36],
      ),
    ),
  };
}

function nationalSectionHeight(data: AtaReviewLayoutData) {
  const rows = data.locations.map((item, index) => [
    `${index + 1}. ${item.name}${item.detail ? ` ${item.detail}` : ""}`,
    String(item.count),
  ]);

  return sectionHeight(
    "Localidades Nacionais",
    tableHeight(["Localidades Nacionais", "Total"], rows, [0.82, 0.18]),
  );
}

export function buildAtaDetailColumnLayout(data: AtaReviewLayoutData): AtaDetailColumnLayout {
  const layout: AtaDetailColumnLayout = { left: [], right: [] };
  const heights = getSectionHeights(data);
  const columnHeights = { left: nationalSectionHeight(data), right: 0 };
  const order: AtaDetailSectionKey[] = [
    "servers",
    "international",
    "visitors",
    "admissions",
    "achievements",
  ];

  for (const key of order) {
    const target = columnHeights.right <= columnHeights.left ? "right" : "left";
    layout[target].push(key);
    columnHeights[target] += heights[key];
  }

  return layout;
}
