module.exports = {
  apps: [
    {
      name: "dashboard",
      script: "npm",
      args: "start",
      cwd: "/var/www/theracure/Theracure-Dashboard",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,

      max_restarts: 10,
      min_uptime: "10s",
      restart_delay: 3000,
      exp_backoff_restart_delay: 100,
      kill_timeout: 5000,
      listen_timeout: 10000,

      node_args: "--max-old-space-size=2048",

      env: {
        NODE_ENV: "production",
        PORT: "3001",
        PUPPETEER_EXECUTABLE_PATH: "/usr/bin/chromium",
        PUPPETEER_SKIP_DOWNLOAD: "true",
      },

      error_file: "/var/log/pm2/dashboard-error.log",
      out_file: "/var/log/pm2/dashboard-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    },

    {
      name: "sms-worker",
      script: "node_modules/ts-node/dist/bin.js",
      args: "-r tsconfig-paths/register --compiler-options '{\"module\":\"CommonJS\"}' workers/sms-worker.ts",
      cwd: "/var/www/theracure/Theracure-Dashboard",

      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,

      max_restarts: 10,
      min_uptime: "10s",
      restart_delay: 5000,
      exp_backoff_restart_delay: 100,
      kill_timeout: 5000,

      node_args: "--max-old-space-size=512",

      env: {
        NODE_ENV: "production",
      },

      error_file: "/var/log/pm2/sms-worker-error.log",
      out_file: "/var/log/pm2/sms-worker-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    },
  ],
};
