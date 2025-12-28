module.exports = {
  apps: [
    {
      name: "dashboard",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3001",
      cwd: "/var/www/theracure/Theracure-Dashboard",
      env_production: {
        NODE_ENV: "production",
      },
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      error_file: "/var/log/pm2/dashboard-error.log",
      out_file: "/var/log/pm2/dashboard-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    },
    {
      name: "sms-worker",
      script: "node_modules/ts-node/dist/bin.js",
      args: "-r tsconfig-paths/register --compiler-options '{\"module\":\"CommonJS\"}' workers/sms-worker.ts",
      cwd: "/var/www/theracure/Theracure-Dashboard",
      env_production: {
        NODE_ENV: "production",
      },
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      error_file: "/var/log/pm2/sms-worker-error.log",
      out_file: "/var/log/pm2/sms-worker-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      restart_delay: 5000,
    },
  ],
};
