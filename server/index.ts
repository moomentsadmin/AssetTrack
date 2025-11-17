import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { createApiRouter } from "./routes";
import { storage } from "./storage";
import { hashPassword } from "./auth";
import http from "http";

function log(message: string, source = "server") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

const app = express();

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const apiRouter = createApiRouter();
  app.use("/", apiRouter);

  // Seed a default admin account on first run when the DB is empty
  try {
    const settings = await storage.getSystemSettings();
    const users = await storage.getAllUsers();

    // Only seed default admin if explicitly enabled via env var.
    // This prevents accidental creation of default credentials in production.
    const enableSeed = (process.env.ENABLE_DEFAULT_ADMIN || "false").toLowerCase() === "true";
    const shouldSeed = enableSeed && (!settings || !settings.setupCompleted) && users.length === 0;
    if (shouldSeed) {
      const defaultUsername = process.env.DEFAULT_ADMIN_USERNAME ?? "admin";
      const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD;
      const defaultEmail = process.env.DEFAULT_ADMIN_EMAIL ?? "admin@example.com";
      const defaultFullName = process.env.DEFAULT_ADMIN_FULLNAME ?? "Administrator";

      if (!defaultPassword) {
        log('ENABLE_DEFAULT_ADMIN is set but DEFAULT_ADMIN_PASSWORD is not provided. Skipping seeding for safety.', 'server');
      } else {
        const existing = await storage.getUserByUsername(defaultUsername);
        if (!existing) {
          await storage.createUser({
            username: defaultUsername,
            password: await hashPassword(defaultPassword),
            email: defaultEmail,
            fullName: defaultFullName,
            role: "admin",
            department: null,
            isContractor: false,
          });

          await storage.saveSystemSettings({ setupCompleted: true });
          log(`Default admin created: ${defaultUsername}`);
        } else {
          log(`Default admin not created; user already exists: ${defaultUsername}`);
        }
      }
    }
  } catch (err: any) {
    log(`Error checking/creating default admin: ${err?.message || err}`);
  }

  // Enforce SESSION_SECRET in production (warn but don't exit if missing)
  if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
    log('WARNING: SESSION_SECRET is not set. Using temporary key for this session.', 'server');
  }

  const server = http.createServer(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    const mod = await import("./" + "vite");
    await mod.setupVite(app, server);
  } else {
    const mod = await import("./" + "vite");
    mod.serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen(port, () => {
    log(`serving on port ${port}`);
  });
})();
