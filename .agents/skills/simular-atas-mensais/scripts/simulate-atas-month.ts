import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { sheets as createSheetsClient } from "@googleapis/sheets";
import { JWT } from "google-auth-library";
import {
  createMonthlySimulationPlan,
  SimulationConflictError,
  type AtaBusinessKey,
  type SimulationInput,
  type SimulationPlan,
} from "@/domain/ata-simulation";
import type { Grupo, GrupoHorario } from "@/domain/schemas";
import {
  assertDevSimulationGate,
  executePreparedSimulationCommit,
  isUnknownBatchResult,
  prepareSimulationCommit,
  readSimulationSheetSnapshot,
  reconcilePreparedSimulation,
  type PreparedSimulationCommit,
  type SimulationSheetsClient,
} from "@/lib/sheets/create-simulated-atas";

type Fixture = {
  groups: Grupo[];
  schedules: GrupoHorario[];
  existingKeys: AtaBusinessKey[];
  countries?: string[];
};

type PendingManifest = {
  version: 1;
  state: "planned" | "prepared" | "rejected" | "result-unknown";
  destination: "Google Sheets DEV";
  plan: SimulationPlan;
  records?: PreparedSimulationCommit["records"];
  requestCount?: number;
  reconciliation?: string;
  error?: string;
};

function requiredEnvironment(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  return value;
}

function getSimulationSheetsClient() {
  const auth = new JWT({
    email: requiredEnvironment("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
    key: requiredEnvironment("GOOGLE_PRIVATE_KEY").replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return createSheetsClient({ version: "v4", auth }) as unknown as SimulationSheetsClient;
}

function argument(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function hasArgument(name: string) {
  return process.argv.includes(name);
}

function requiredArgument(name: string) {
  const value = argument(name);
  if (!value) throw new Error(`Argumento obrigatório ausente: ${name}`);
  return value;
}

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

async function writeJsonAtomic(path: string, value: unknown) {
  const temporary = `${path}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(temporary, path);
}

function slug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function summary(plan: SimulationPlan, state: string) {
  const uniqueDates = new Set(
    plan.submissions.map((submission) => submission.ata.data_reuniao),
  ).size;
  const participation = plan.submissions.flatMap(
    (submission) => submission.participacao,
  );
  const national = participation.filter((item) => item.pais === "Brasil");
  const international = participation.filter((item) => item.pais !== "Brasil");
  const visitors = plan.submissions.reduce(
    (total, submission) => total + submission.visitantes.length,
    0,
  );
  const entries = plan.submissions.reduce(
    (total, submission) => total + submission.ingressos.length,
    0,
  );
  const conquestAtas = plan.submissions.filter(
    (submission) => submission.trocas_chaveiro.length > 0,
  ).length;
  const conquests = plan.submissions.reduce(
    (total, submission) => total + submission.trocas_chaveiro.length,
    0,
  );
  return `# Resumo da simulação mensal

- Grupo: ${plan.grupo.grupo_nome} (${plan.grupo.grupo_id})
- Mês/ano: ${plan.input.mes}/${plan.input.ano}
- Seed efetiva: ${plan.input.seed}
- Dias com reunião: ${uniqueDates}
- Atas: ${plan.submissions.length}
- Servidores: ${plan.submissions.length * 2}
- Localidades nacionais: ${national.length}
- Membros internacionais: ${international.length}
- Visitantes: ${visitors}
- Ingressos: ${entries}
- Atas com conquistas: ${conquestAtas}
- Total de conquistas: ${conquests}
- Conflitos: ${plan.conflicts.length}
- Validações: ${plan.validations.join(", ")}
- Destino: Google Sheets DEV
- Produção: bloqueada
- Persistência: ${state}
`;
}

async function updateSummary(runDirectory: string, plan: SimulationPlan, state: string) {
  await writeFile(join(runDirectory, "summary.md"), summary(plan, state), "utf8");
}

async function planCommand() {
  const inputPath = resolve(requiredArgument("--input"));
  const input = await readJson<SimulationInput>(inputPath);
  const fixturePath = argument("--fixture");
  let plan: SimulationPlan;
  if (fixturePath) {
    if (process.env.NODE_ENV !== "test") {
      throw new Error("--fixture é permitido somente com NODE_ENV=test.");
    }
    const fixture = await readJson<Fixture>(resolve(fixturePath));
    plan = createMonthlySimulationPlan(
      input,
      fixture.groups,
      fixture.schedules,
      fixture.existingKeys,
      fixture.countries,
    );
  } else {
    const spreadsheetId = process.env.GOOGLE_SHEETS_DEV_ID;
    if (!spreadsheetId) throw new Error("GOOGLE_SHEETS_DEV_ID é obrigatório.");
    const client = getSimulationSheetsClient();
    const snapshot = await readSimulationSheetSnapshot(client, spreadsheetId);
    plan = createMonthlySimulationPlan(
      input,
      snapshot.groups,
      snapshot.schedules,
      snapshot.existingKeys,
    );
  }
  const runDirectory = resolve(
    "artifacts",
    "ata-simulations",
    `${slug(plan.grupo.grupo_nome)}-${plan.input.ano}-${String(plan.input.mes).padStart(2, "0")}-${slug(plan.input.seed)}`,
  );
  await mkdir(dirname(runDirectory), { recursive: true });
  await mkdir(runDirectory);
  await writeJsonAtomic(join(runDirectory, "input.json"), plan.input);
  await writeJsonAtomic(join(runDirectory, "validation.json"), {
    valid: true,
    validations: plan.validations,
    conflicts: plan.conflicts,
    persistence: "not-started",
  });
  const manifest: PendingManifest = {
    version: 1,
    state: "planned",
    destination: "Google Sheets DEV",
    plan,
  };
  await writeJsonAtomic(
    join(runDirectory, "commit-manifest.pending.json"),
    manifest,
  );
  await updateSummary(runDirectory, plan, "planejada; nenhuma escrita realizada");
  console.log(
    JSON.stringify(
      {
        runDirectory,
        grupo: plan.grupo,
        mes: plan.input.mes,
        ano: plan.input.ano,
        seed: plan.input.seed,
        atas: plan.submissions.length,
        destination: fixturePath ? "fixture local" : "Google Sheets DEV",
        production: "blocked",
        persisted: false,
      },
      null,
      2,
    ),
  );
}

async function commitCommand() {
  const runDirectory = resolve(requiredArgument("--run"));
  const productionRequested = hasArgument("--prod");
  const authorized = hasArgument("--authorized");
  const spreadsheetId = process.env.GOOGLE_SHEETS_DEV_ID;
  assertDevSimulationGate({
    enabled: process.env.ATA_SIMULATION_ENABLED,
    configuredDevId: spreadsheetId,
    targetId: spreadsheetId,
    authorized,
    productionRequested,
  });
  const pendingPath = join(runDirectory, "commit-manifest.pending.json");
  const pending = await readJson<PendingManifest>(pendingPath);
  if (pending.version !== 1 || pending.state !== "planned") {
    throw new Error("Manifesto pendente inválido para commit.");
  }
  const client = getSimulationSheetsClient();
  const snapshot = await readSimulationSheetSnapshot(client, spreadsheetId!);
  const prepared = prepareSimulationCommit(pending.plan, snapshot);
  const preparedManifest: PendingManifest = {
    ...pending,
    state: "prepared",
    records: prepared.records,
    requestCount: prepared.requests.length,
  };
  await writeJsonAtomic(pendingPath, preparedManifest);
  try {
    await executePreparedSimulationCommit(client, spreadsheetId!, prepared);
  } catch (error) {
    const message = error instanceof Error ? error.message : "erro desconhecido";
    if (!isUnknownBatchResult(error)) {
      await writeJsonAtomic(pendingPath, {
        ...preparedManifest,
        state: "rejected",
        error: message,
      });
      await updateSummary(runDirectory, pending.plan, "lote rejeitado; nenhuma linha considerada persistida");
      throw error;
    }
    const afterUnknown = await readSimulationSheetSnapshot(client, spreadsheetId!);
    const reconciliation = reconcilePreparedSimulation(prepared, afterUnknown);
    await writeJsonAtomic(pendingPath, {
      ...preparedManifest,
      state: "result-unknown",
      reconciliation,
      error: message,
    });
    await updateSummary(runDirectory, pending.plan, `resultado de rede reconciliado como ${reconciliation}`);
    if (reconciliation !== "committed") {
      throw new Error(
        `Resultado da escrita desconhecido; reconciliação: ${reconciliation}. Não repita automaticamente.`,
      );
    }
  }
  const after = await readSimulationSheetSnapshot(client, spreadsheetId!);
  const reconciliation = reconcilePreparedSimulation(prepared, after);
  if (reconciliation !== "committed") {
    await updateSummary(runDirectory, pending.plan, `leitura final: ${reconciliation}`);
    throw new Error(`Leitura final não confirmou o lote: ${reconciliation}.`);
  }
  const committed = {
    ...preparedManifest,
    state: "committed",
    reconciliation,
    committedAt: new Date().toISOString(),
  };
  await writeJsonAtomic(
    join(runDirectory, "commit-manifest.committed.json"),
    committed,
  );
  await writeJsonAtomic(join(runDirectory, "validation.json"), {
    valid: true,
    validations: pending.plan.validations,
    conflicts: [],
    persistence: "committed",
    reconciliation,
  });
  await updateSummary(runDirectory, pending.plan, "confirmada em DEV por releitura");
  console.log(
    JSON.stringify(
      {
        runDirectory: basename(runDirectory),
        atas: prepared.records.length,
        requestCount: prepared.requests.length,
        destination: "Google Sheets DEV",
        production: "blocked",
        reconciliation,
      },
      null,
      2,
    ),
  );
}

async function main() {
  const command = process.argv[2];
  if (command === "plan") return planCommand();
  if (command === "commit-dev") return commitCommand();
  throw new Error("Use plan ou commit-dev.");
}

main().catch((error: unknown) => {
  if (error instanceof SimulationConflictError) {
    console.error(
      JSON.stringify(
        { error: error.message, conflicts: error.conflicts },
        null,
        2,
      ),
    );
  } else {
    console.error(error instanceof Error ? error.message : error);
  }
  process.exitCode = 1;
});
