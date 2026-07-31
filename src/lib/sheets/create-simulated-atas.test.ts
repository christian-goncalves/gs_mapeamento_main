import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  createMonthlySimulationPlan,
  SimulationConflictError,
} from "@/domain/ata-simulation";
import type { Grupo, GrupoHorario } from "@/domain/schemas";
import { SHEET_HEADERS, type SheetName } from "./contract";
import {
  assertDevSimulationGate,
  executePreparedSimulationCommit,
  isUnknownBatchResult,
  prepareSimulationCommit,
  reconcilePreparedSimulation,
  type SimulationSheetSnapshot,
} from "./create-simulated-atas";

const groupId = "fccced1d-92a5-4d24-b5af-da65cbbe467f";
const audit = {
  created_at: "2026-07-01T00:00:00.000Z",
  updated_at: "2026-07-01T00:00:00.000Z",
};
const group: Grupo = {
  grupo_id: groupId,
  zoom_id: "123456789",
  grupo_nome: "Grupo Genérico",
  ordem: 1,
  ativo: true,
  responsavel_grupo_nome: "",
  responsavel_grupo_email: "",
  email_acesso_grupo: "",
  responsaveis_ata: "",
  link_formulario_ata: "",
  ultima_reuniao_anterior: 0,
  ...audit,
};
const schedule: GrupoHorario = {
  horario_id: "93ef9660-8c64-4b51-9bc5-09069ce629c1",
  grupo_id: groupId,
  dia_semana: "segunda",
  hora_inicio: "20:00",
  link_reuniao: "",
  ativo: true,
  ...audit,
};

function snapshot(): SimulationSheetSnapshot {
  const names = Object.keys(SHEET_HEADERS) as SheetName[];
  return {
    values: Object.fromEntries(
      names.map((name) => [name, [[...SHEET_HEADERS[name]]]]),
    ) as SimulationSheetSnapshot["values"],
    sheetIds: Object.fromEntries(
      names.map((name, index) => [name, index + 1]),
    ) as SimulationSheetSnapshot["sheetIds"],
    rowCounts: Object.fromEntries(
      names.map((name) => [name, 10_000]),
    ) as SimulationSheetSnapshot["rowCounts"],
    groups: [group],
    schedules: [schedule],
    existingKeys: [],
    identifiers: [],
    recordIds: {
      atas: [],
      servidores: [],
      participacao: [],
      visitantes: [],
      ingressos: [],
      trocas_chaveiro: [],
    },
  };
}

function simulation() {
  return createMonthlySimulationPlan(
    {
      grupo: "Grupo Genérico",
      mes: 8,
      ano: 2026,
      servidores: ["Ana", "Bruno", "Carla"],
      seed: "202608",
    },
    [group],
    [schedule],
    [],
  );
}

function identity() {
  let counter = 0;
  return {
    now: () => "2026-08-01T00:00:00.000Z",
    uuid: () => {
      counter += 1;
      return `00000000-0000-4000-8000-${String(counter).padStart(12, "0")}`;
    },
  };
}

describe("gate técnico DEV", () => {
  it.each([
    [{ enabled: "false", configuredDevId: "dev", targetId: "dev", authorized: true }, "ATA_SIMULATION_ENABLED"],
    [{ enabled: "true", configuredDevId: undefined, targetId: undefined, authorized: true }, "GOOGLE_SHEETS_DEV_ID"],
    [{ enabled: "true", configuredDevId: "dev", targetId: "prod", authorized: true }, "não corresponde"],
    [{ enabled: "true", configuredDevId: "dev", targetId: "dev", authorized: false }, "Autorização"],
    [{ enabled: "true", configuredDevId: "dev", targetId: "dev", authorized: true, productionRequested: true }, "Produção"],
  ])("rejeita configuração insegura", (options, message) => {
    expect(() => assertDevSimulationGate(options)).toThrow(message);
  });

  it("aceita somente destino DEV idêntico e autorização explícita", () => {
    expect(
      assertDevSimulationGate({
        enabled: "true",
        configuredDevId: "dev",
        targetId: "dev",
        authorized: true,
      }),
    ).toBe("dev");
  });
});

describe("preparação e atomicidade mensal", () => {
  it("reserva sequências únicas e agrupa todas as abas em seis requests", () => {
    const prepared = prepareSimulationCommit(
      simulation(),
      snapshot(),
      identity(),
    );
    expect(prepared.requests).toHaveLength(6);
    expect(
      prepared.records.map((record) => record.ata.numero_sequencial_grupo),
    ).toEqual(
      Array.from({ length: prepared.records.length }, (_, index) => index + 1),
    );
    expect(
      prepared.records.map((record) => record.ata.indice_personalizado_grupo),
    ).toEqual(
      Array.from({ length: prepared.records.length }, (_, index) => index + 1),
    );
    expect(
      prepared.requests.map(
        (request) => request.updateCells?.rows?.length ?? 0,
      ),
    ).toEqual([
      prepared.records.length,
      prepared.records.length * 2,
      prepared.records.reduce(
        (total, record) => total + record.participacao.length,
        0,
      ),
      prepared.records.reduce(
        (total, record) => total + record.visitantes.length,
        0,
      ),
      prepared.records.reduce(
        (total, record) => total + record.ingressos.length,
        0,
      ),
      prepared.records.reduce(
        (total, record) => total + record.trocas_chaveiro.length,
        0,
      ),
    ]);
  });

  it("amplia grades insuficientes dentro do mesmo lote antes de escrever", () => {
    const current = snapshot();
    current.rowCounts.participacao = 1;
    const prepared = prepareSimulationCommit(
      simulation(),
      current,
      identity(),
    );
    expect(prepared.requests[0].appendDimension).toEqual({
      sheetId: current.sheetIds.participacao,
      dimension: "ROWS",
      length:
        prepared.records.reduce(
          (total, record) => total + record.participacao.length,
          0,
        ),
    });
    expect(
      prepared.requests.slice(1).every((request) => request.updateCells),
    ).toBe(true);
  });

  it("aborta o mês antes de materializar quando surge duplicidade", () => {
    const planned = simulation();
    const current = snapshot();
    current.existingKeys = [
      {
        grupo_id: groupId,
        data_reuniao: planned.submissions[0].ata.data_reuniao,
        hora_inicio: planned.submissions[0].ata.hora_inicio,
      },
    ];
    const materializer = {
      now: vi.fn(() => "2026-08-01T00:00:00.000Z"),
      uuid: vi.fn(() => "00000000-0000-4000-8000-000000000001"),
    };
    expect(() =>
      prepareSimulationCommit(planned, current, materializer),
    ).toThrow(SimulationConflictError);
    expect(materializer.uuid).not.toHaveBeenCalled();
  });

  it("executa uma única batchUpdate e propaga rejeição", async () => {
    const prepared = prepareSimulationCommit(
      simulation(),
      snapshot(),
      identity(),
    );
    const batchUpdate = vi.fn().mockResolvedValue({});
    await executePreparedSimulationCommit(
      { spreadsheets: { batchUpdate } },
      "dev",
      prepared,
    );
    expect(batchUpdate).toHaveBeenCalledOnce();
    const failure = vi.fn().mockRejectedValue({ response: { status: 400 } });
    await expect(
      executePreparedSimulationCommit(
        { spreadsheets: { batchUpdate: failure } },
        "dev",
        prepared,
      ),
    ).rejects.toEqual({ response: { status: 400 } });
    expect(failure).toHaveBeenCalledOnce();
  });

  it("reconcilia UUIDs e chaves sem repetir a escrita", () => {
    const prepared = prepareSimulationCommit(
      simulation(),
      snapshot(),
      identity(),
    );
    const after = snapshot();
    after.existingKeys = prepared.records.map(({ ata }) => ({
      grupo_id: ata.grupo_id,
      data_reuniao: ata.data_reuniao,
      hora_inicio: ata.hora_inicio,
    }));
    after.recordIds = {
      atas: prepared.records.map((item) => item.ata.ata_id),
      servidores: prepared.records.flatMap((item) =>
        item.servidores.map((row) => row.servidor_id),
      ),
      participacao: prepared.records.flatMap((item) =>
        item.participacao.map((row) => row.participacao_id),
      ),
      visitantes: prepared.records.flatMap((item) =>
        item.visitantes.map((row) => row.visitante_id),
      ),
      ingressos: prepared.records.flatMap((item) =>
        item.ingressos.map((row) => row.ingresso_id),
      ),
      trocas_chaveiro: prepared.records.flatMap((item) =>
        item.trocas_chaveiro.map((row) => row.troca_chaveiro_id),
      ),
    };
    expect(reconcilePreparedSimulation(prepared, after)).toBe("committed");
    after.recordIds.visitantes.pop();
    expect(reconcilePreparedSimulation(prepared, after)).toBe(
      "partial-or-unknown",
    );
    expect(reconcilePreparedSimulation(prepared, snapshot())).toBe(
      "not-committed",
    );
  });

  it("classifica falha de rede como resultado desconhecido", () => {
    expect(isUnknownBatchResult({ code: "ECONNRESET" })).toBe(true);
    expect(isUnknownBatchResult({ response: { status: 503 } })).toBe(true);
    expect(isUnknownBatchResult({ response: { status: 400 } })).toBe(false);
  });
});
