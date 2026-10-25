import { describe, expect, it } from "vitest";
import { convertLocalMeetingToBrasilia } from "./time-zones";

describe("conversão de agenda para Brasília", () => {
  it.each([
    ["America/Noronha", "2026-10-22", "00:30", "2026-10-21", "23:30"],
    ["America/Manaus", "2026-10-22", "23:30", "2026-10-23", "00:30"],
    ["America/Rio_Branco", "2026-10-22", "23:30", "2026-10-23", "01:30"],
  ])("converte %s com virada correta de data", (zone, sourceDate, time, date, expectedTime) => {
    const result = convertLocalMeetingToBrasilia(sourceDate, time, zone);
    expect(result.data).toBe(date);
    expect(result.horario).toBe(expectedTime);
  });
});
