import { defineRailway, github, project, service } from "railway/iac";

export default defineRailway(() => {
  const web = service("danios-web", {
    source: github("idkeman/DaniOS", { branch: "main" }),
    start: "npm start",
    healthcheck: "/api/health",
    healthcheckTimeout: 30
  });

  return project("DaniOS", { resources: [web] });
});
