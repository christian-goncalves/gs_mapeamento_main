import fs from "node:fs";
import { chromium } from "playwright";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const outputDir =
  process.env.PLAYWRIGHT_AUDIT_OUTPUT ?? "/tmp/gs-playwright-audit/authenticated";

function loadEnvFile(path) {
  if (!fs.existsSync(path)) return;
  const lines = fs.readFileSync(path, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index < 0) continue;
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value.replace(/\\n/g, "\n");
  }
}

function redact(value) {
  if (!value) return "missing";
  return `set len=${value.length}`;
}

async function waitForAppSession(page) {
  const startedAt = Date.now();
  const timeoutMs = Number(process.env.PLAYWRIGHT_LOGIN_TIMEOUT_MS ?? 120000);
  while (Date.now() - startedAt < timeoutMs) {
    const current = new URL(page.url());
    const target = new URL(baseUrl);
    if (
      current.hostname === target.hostname &&
      current.port === target.port &&
      current.pathname !== "/login"
    ) {
      return;
    }
    await page.waitForTimeout(500);
  }
  throw new Error(`Login nao concluiu no app. URL final: ${page.url()}`);
}

async function login(page) {
  const email = process.env.PLAYWRIGHT_EMAIL;
  const password = process.env.PLAYWRIGHT_PASSWORD;
  if (!email || !password) {
    throw new Error(
      "Defina PLAYWRIGHT_EMAIL e PLAYWRIGHT_PASSWORD em .env.playwright.local.",
    );
  }

  console.log(`PLAYWRIGHT_EMAIL=${redact(email)}`);
  console.log(`PLAYWRIGHT_PASSWORD=${redact(password)}`);
  await page.goto("/login", { waitUntil: "networkidle", timeout: 60000 });
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: /^Entrar$/ }).click();
  try {
    await waitForAppSession(page);
  } catch (error) {
    await fs.promises.mkdir(outputDir, { recursive: true });
    await page.screenshot({
      path: `${outputDir}/login-failure.png`,
      fullPage: true,
    });
    const visibleText = await page.locator("body").innerText().catch(() => "");
    await fs.promises.writeFile(
      `${outputDir}/login-failure.txt`,
      visibleText.replace(password, "[redacted-password]").replace(email, "[redacted-email]"),
    );
    const formError = await page
      .locator(".form-error")
      .first()
      .innerText()
      .catch(() => "");
    throw new Error(
      `${error instanceof Error ? error.message : "Login falhou"}` +
        `${formError ? ` Mensagem visivel: ${formError}` : ""}` +
        ` Evidencias: ${outputDir}/login-failure.png e ${outputDir}/login-failure.txt`,
    );
  }
}

async function collectMetrics(page) {
  return page.evaluate(() => {
    const body = document.body;
    const doc = document.documentElement;
    const rect = (selector) => {
      const node = document.querySelector(selector);
      const r = node?.getBoundingClientRect();
      return r
        ? {
            x: Math.round(r.x),
            y: Math.round(r.y),
            w: Math.round(r.width),
            h: Math.round(r.height),
          }
        : null;
    };
    const all = (selector) =>
      Array.from(document.querySelectorAll(selector))
        .slice(0, 10)
        .map((node) => {
          const r = node.getBoundingClientRect();
          return {
            text:
              node.textContent?.trim().replace(/\s+/g, " ").slice(0, 70) ?? "",
            x: Math.round(r.x),
            y: Math.round(r.y),
            w: Math.round(r.width),
            h: Math.round(r.height),
          };
        });

    return {
      title: document.title,
      h1: document.querySelector("h1")?.textContent?.trim() || "",
      text: body.innerText.slice(0, 240).replace(/\s+/g, " ").trim(),
      scrollWidth: Math.max(body.scrollWidth, doc.scrollWidth),
      scrollHeight: Math.max(body.scrollHeight, doc.scrollHeight),
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      hOverflow: Math.max(body.scrollWidth, doc.scrollWidth) - window.innerWidth,
      vOverflow: Math.max(body.scrollHeight, doc.scrollHeight) - window.innerHeight,
      shell: rect(".responsavel-layout, .admin-layout, .shell"),
      sidebar: rect(".responsavel-sidebar, .admin-sidebar"),
      brand: rect(".responsavel-brand, .admin-brand"),
      nav: rect(".responsavel-nav, .admin-nav"),
      activeNav: rect(".responsavel-nav-item-active, .admin-nav-item-active"),
      main: rect(".responsavel-main, .admin-main, .detail-shell"),
      header: rect("header"),
      firstCard: rect(".card, .responsavel-atas-card, .admin-atas-card"),
      firstTableWrap: rect(
        ".table-scroll, .responsavel-table-wrap, .admin-atas-table-wrap",
      ),
      repeatRows: all(".repeat-row"),
      navItems: all(".responsavel-nav-item, .admin-nav-item"),
      cards: all(".card, .summary-card, .responsavel-atas-card, .admin-atas-card"),
    };
  });
}

loadEnvFile(".env.playwright.local");

if (!process.env.PLAYWRIGHT_EMAIL || !process.env.PLAYWRIGHT_PASSWORD) {
  throw new Error(
    "Defina PLAYWRIGHT_EMAIL e PLAYWRIGHT_PASSWORD em .env.playwright.local.",
  );
}

await fs.promises.mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({
  headless: process.env.PLAYWRIGHT_HEADLESS !== "false",
  executablePath: process.env.PLAYWRIGHT_CHROME_PATH ?? "/usr/bin/google-chrome",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const context = await browser.newContext({
  baseURL: baseUrl,
  viewport: { width: 768, height: 905 },
});
const page = await context.newPage();

try {
  await login(page);

  const viewports = [
    { width: 768, height: 905 },
    { width: 720, height: 905 },
    { width: 709, height: 905 },
    { width: 529, height: 905 },
    { width: 425, height: 962 },
    { width: 385, height: 905 },
    { width: 335, height: 905 },
  ];
  const urls = [
    { name: "atas-nova", url: "/atas/nova" },
    { name: "responsavel-atas", url: "/responsavel/atas" },
    { name: "responsavel-relatorios", url: "/responsavel/relatorios" },
    {
      name: "ata-detalhe",
      url: "/atas/84ecd00d-a410-47e8-b621-62a7625696b1",
    },
    {
      name: "grupo-config",
      url: "/grupos/8806319f-dd2d-4b67-9416-ab42bb991870",
    },
  ];
  const results = [];
  const reportPath = `${outputDir}/report.json`;

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    for (const target of urls) {
      try {
        const response = await page.goto(target.url, {
          waitUntil: "domcontentloaded",
          timeout: 60000,
        });
        await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
        const finalUrl = page.url().replace(baseUrl, "");
        const metrics = await collectMetrics(page);
        const screenshot = `${outputDir}/${target.name}-${viewport.width}.png`;
        await page.screenshot({ path: screenshot, fullPage: true });
        results.push({
          viewport,
          target,
          status: response?.status() ?? null,
          finalUrl,
          screenshot,
          ...metrics,
        });
        console.log(
          `AUDITED ${target.name} ${viewport.width}px final=${finalUrl} overflow=${metrics.hOverflow} h1=${metrics.h1}`,
        );
      } catch (error) {
        const screenshot = `${outputDir}/${target.name}-${viewport.width}-error.png`;
        await page.screenshot({ path: screenshot, fullPage: true }).catch(() => {});
        results.push({
          viewport,
          target,
          status: null,
          finalUrl: page.url().replace(baseUrl, ""),
          screenshot,
          error: error instanceof Error ? error.message : String(error),
        });
        console.log(
          `ERROR ${target.name} ${viewport.width}px final=${page.url()} message=${error instanceof Error ? error.message : String(error)}`,
        );
      }
      await fs.promises.writeFile(reportPath, JSON.stringify(results, null, 2));
    }
  }

  console.log(`REPORT ${reportPath}`);
} finally {
  await browser.close();
}
