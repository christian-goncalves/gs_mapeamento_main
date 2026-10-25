export class SheetsOperationError extends Error {
  constructor(readonly operation: "read" | "write", options?: ErrorOptions) {
    super(`Falha operacional no Sheets durante ${operation}.`, options);
    this.name = "SheetsOperationError";
  }
}
