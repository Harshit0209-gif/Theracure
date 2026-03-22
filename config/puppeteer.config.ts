export const PUPPETEER_CONFIG = {
  headless: true,
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-accelerated-2d-canvas",
    "--no-first-run",
    "--no-zygote",
    "--disable-gpu",
    "--disable-features=VizDisplayCompositor",
    "--single-process",
    "--disable-crash-reporter",
    "--disable-crashpad",
    "--disable-breakpad",
  ],
  timeout: 30000,
};
