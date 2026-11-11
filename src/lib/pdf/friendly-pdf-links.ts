function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "grupo";
}

export function friendlyGroupKey(groupName: string, groupId: string) {
  return `${slugify(groupName)}-${groupId.slice(0, 8).toLowerCase()}`;
}

export function monthlyReportPdfPath({
  groupId,
  groupName,
  month,
  year,
}: {
  groupId: string;
  groupName: string;
  month: string | number;
  year: string | number;
}) {
  return `/relatorio-mensal/${friendlyGroupKey(groupName, groupId)}/${String(month).padStart(2, "0")}/${year}`;
}

export function ataPdfPath({
  groupId,
  groupName,
  number,
  date,
}: {
  groupId: string;
  groupName: string;
  number: number;
  date: string;
}) {
  const [year, month, day] = date.split("-");
  return `/ata-${number}/${day}-${month}-${year}/${friendlyGroupKey(groupName, groupId)}`;
}
