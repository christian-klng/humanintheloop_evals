import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import { runMigrations } from "./migrate.js";
import healthRouter from "./routes/health.js";
import authRouter from "./routes/auth.js";
import projectsRouter from "./routes/projects.js";
import criteriaRouter from "./routes/criteria.js";
import runsRouter from "./routes/runs.js";
import workspacesRouter from "./routes/workspaces.js";
import { requireAuth } from "./middleware/auth.js";

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);

app.use(express.json());
app.use(cookieParser());

// Public routes
app.use("/api", healthRouter);
app.use("/api/auth", authRouter);

// Protected routes
app.use("/api", requireAuth);
app.use("/api", projectsRouter);
app.use("/api", criteriaRouter);
app.use("/api", runsRouter);
app.use("/api", workspacesRouter);

// Production: serve Vite build
if (process.env.NODE_ENV === "production") {
  const distPath = path.resolve("dist");
  app.use(express.static(distPath));
  app.get("{*path}", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

async function start() {
  try {
    await runMigrations();
    console.log("Migrations complete");
  } catch (err) {
    console.error("Migration failed, exiting", err);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();
