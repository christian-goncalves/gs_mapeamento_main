export type LocalDateTimeParts = { year: string; month: string; day: string; hour: string; minute: string; second: string };

export function dateTimePartsInZone(date: Date, timeZone: string): LocalDateTimeParts {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return { year: values.year ?? "0000", month: values.month ?? "00", day: values.day ?? "00", hour: values.hour ?? "00", minute: values.minute ?? "00", second: values.second ?? "00" };
}

export function localDateTimeToInstant(data: string, horario: string, timeZone: string) {
  const desired = `${data}T${horario}:00`;
  let instant = new Date(`${desired}Z`);
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const parts = dateTimePartsInZone(instant, timeZone);
    const represented = `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`;
    const difference = Date.parse(`${desired}Z`) - Date.parse(`${represented}Z`);
    if (!difference) break;
    instant = new Date(instant.getTime() + difference);
  }
  return instant;
}

export function convertLocalMeetingToBrasilia(data: string, horario: string, sourceTimeZone: string) {
  const instant = localDateTimeToInstant(data, horario, sourceTimeZone);
  const parts = dateTimePartsInZone(instant, "America/Sao_Paulo");
  return { instant, data: `${parts.year}-${parts.month}-${parts.day}`, horario: `${parts.hour}:${parts.minute}` };
}
