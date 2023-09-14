module.exports = {
  apps: [
    {
      name: "EXCEL_TO_CSV",
      script: "index.js",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};
