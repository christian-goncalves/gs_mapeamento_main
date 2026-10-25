export function parseApplyOptions(args: string[], spreadsheetId: string) {
  const apply = args.includes("--apply");
  const dryRun = args.includes("--dry-run");
  const confirmation = args.find((arg) => arg.startsWith("--confirm-target="))?.slice("--confirm-target=".length);

  if (apply && dryRun) throw new Error("Use apenas um modo: simulação padrão ou --apply.");
  if (!apply && confirmation) throw new Error("--confirm-target só pode ser usado junto com --apply.");
  if (apply && !spreadsheetId) throw new Error("GOOGLE_SHEETS_ID é obrigatório para aplicar.");
  if (apply && confirmation !== spreadsheetId) {
    throw new Error("Para aplicar, informe --confirm-target com o mesmo ID de GOOGLE_SHEETS_ID.");
  }

  return { apply, dryRun: !apply };
}
