import { describe, expect, it } from "vitest";
import { ataPlatformErrorMessage, findRecurringAtaSchedules, getAtaPlatformPreflightError, resolveAtaPlatform } from "./ata-platform";

const groupId = "11111111-1111-4111-8111-111111111111";
const platformId = "22222222-2222-4222-8222-222222222222";
const schedule = { horario_id: "33333333-3333-4333-8333-333333333333", grupo_id: groupId, dia_semana: "segunda" as const, hora_inicio: "00:30", link_reuniao: "", plataforma_id: platformId, ativo: true, created_at: "2026-10-20T12:00:00.000Z", updated_at: "2026-10-20T12:00:00.000Z" };
const platform = { plataforma_id: platformId, grupo_id: groupId, tipo: "zoom" as const, link: "https://example.org", id_acesso: "", senha_pin: "", ativo: true, created_at: "2026-10-01T12:00:00.000Z", updated_at: "2026-10-01T12:00:00.000Z" };

describe("plataforma efetiva da ata", () => {
  it("resolve o provedor do horário recorrente convertido para Brasília", () => {
    expect(resolveAtaPlatform({ groupId, timeZone: "America/Noronha", date: "2026-10-25", time: "23:30", schedules: [schedule], platforms: [platform], explicitPlatform: "whatsapp" })).toEqual({ type: "zoom", extra: false });
  });

  it("exige configuração ativa explícita para reunião extra", () => {
    expect(resolveAtaPlatform({ groupId, timeZone: "America/Sao_Paulo", date: "2026-10-27", time: "10:00", schedules: [schedule], platforms: [platform], explicitPlatform: "zoom" })).toEqual({ type: "zoom", extra: true });
    expect(() => resolveAtaPlatform({ groupId, timeZone: "America/Sao_Paulo", date: "2026-10-27", time: "10:00", schedules: [schedule], platforms: [], explicitPlatform: "zoom" })).toThrow("Selecione uma plataforma ativa");
  });

  it("preflight bloqueia recorrência sem vínculo e agenda duplicada antes da revisão", () => {
    expect(getAtaPlatformPreflightError({ matchingScheduleCount: 1, explicitPlatformConfirmed: false, activePlatformTypes: ["zoom"], selectedPlatform: "zoom" }))
      .toBe("recurring_platform_unavailable");
    expect(getAtaPlatformPreflightError({ matchingScheduleCount: 2, explicitPlatformConfirmed: true, activePlatformTypes: ["zoom"], selectedPlatform: "zoom" }))
      .toBe("duplicate_schedule");
    expect(ataPlatformErrorMessage("recurring_platform_unavailable"))
      .toContain("Peça ao administrador do grupo");
    expect(ataPlatformErrorMessage("duplicate_schedule"))
      .toContain("horários duplicados");
  });

  it("preflight exige seleção explícita e ativa para reunião extra", () => {
    expect(getAtaPlatformPreflightError({ matchingScheduleCount: 0, explicitPlatformConfirmed: false, activePlatformTypes: ["zoom"], selectedPlatform: "zoom" }))
      .toBe("extra_platform_unavailable");
    expect(getAtaPlatformPreflightError({ matchingScheduleCount: 0, explicitPlatformConfirmed: true, activePlatformTypes: ["zoom"], selectedPlatform: "whatsapp" }))
      .toBe("extra_platform_unavailable");
    expect(getAtaPlatformPreflightError({ matchingScheduleCount: 0, explicitPlatformConfirmed: true, activePlatformTypes: ["zoom"], selectedPlatform: "zoom" }))
      .toBeUndefined();
  });

  it("identifica todos os horários correspondentes usando a mesma regra do servidor", () => {
    const duplicate = { ...schedule, horario_id: "44444444-4444-4444-8444-444444444444" };
    expect(findRecurringAtaSchedules({
      groupId,
      timeZone: "America/Noronha",
      date: "2026-10-25",
      time: "23:30",
      schedules: [schedule, duplicate],
    })).toHaveLength(2);
  });
});
