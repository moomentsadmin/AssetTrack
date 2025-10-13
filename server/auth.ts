// Authentication from blueprint:javascript_auth_all_persistance
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const isProduction = process.env.NODE_ENV === 'production';
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  };

  if (isProduction) {
    app.set("trust proxy", 1);
  }
  
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  // Check if setup is required
  app.get("/api/setup/status", async (req, res) => {
    try {
      const settings = await storage.getSystemSettings();
      const setupCompleted = settings?.setupCompleted || false;
      res.json({ setupCompleted });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Initial setup - creates admin user with custom credentials
  app.post("/api/setup", async (req, res, next) => {
    try {
      const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
      
      const settings = await storage.getSystemSettings();
      if (settings?.setupCompleted) {
        console.warn(`⚠️ Setup attempt after completion from IP: ${clientIp}`);
        return res.status(400).send("Setup already completed");
      }

      // Require custom admin credentials
      const { username, password, email, fullName } = req.body;
      
      if (!username || !password || !email || !fullName) {
        console.warn(`⚠️ Invalid setup attempt from IP: ${clientIp} - missing fields`);
        return res.status(400).send("All fields are required: username, password, email, fullName");
      }

      // Validate username length
      if (username.length < 3) {
        console.warn(`⚠️ Invalid setup attempt from IP: ${clientIp} - username too short`);
        return res.status(400).send("Username must be at least 3 characters long");
      }

      // Validate password length
      if (password.length < 8) {
        console.warn(`⚠️ Invalid setup attempt from IP: ${clientIp} - weak password`);
        return res.status(400).send("Password must be at least 8 characters long");
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        console.warn(`⚠️ Invalid setup attempt from IP: ${clientIp} - invalid email`);
        return res.status(400).send("Invalid email address");
      }

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        console.warn(`⚠️ Invalid setup attempt from IP: ${clientIp} - username exists`);
        return res.status(400).send("Username already exists");
      }

      console.log(`🔧 First-time setup initiated from IP: ${clientIp}`);

      // Create admin user with provided credentials
      const adminUser = await storage.createUser({
        username,
        password: await hashPassword(password),
        email,
        fullName,
        role: "admin",
        department: null,
        isContractor: false,
      });

      // Mark setup as completed
      await storage.saveSystemSettings({ setupCompleted: true });

      // Log the admin in
      req.login(adminUser, (err) => {
        if (err) return next(err);
        console.log(`✅ First-time setup completed from IP: ${clientIp}. Admin user created: ${username}`);
        res.status(201).json(adminUser);
      });
    } catch (error: any) {
      const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
      console.error(`❌ Setup failed from IP: ${clientIp}:`, error);
      res.status(500).send(error.message);
    }
  });

  // Register route (disabled - for admin use only)
  app.post("/api/register", async (req, res, next) => {
    return res.status(403).send("Registration is disabled. Please contact an administrator.");
  });

  app.post("/api/login", (req, res, next) => {
    console.log("🔐 Login attempt:", { username: req.body.username, hasPassword: !!req.body.password });
    
    passport.authenticate("local", (err: any, user: any, info: any) => {
      console.log("🔑 Auth result:", { err, hasUser: !!user, info });
      
      if (err) return next(err);
      if (!user) {
        console.log("❌ Authentication failed - Invalid credentials");
        return res.status(401).send("Invalid credentials");
      }
      
      req.login(user, (err) => {
        if (err) {
          console.log("❌ Session login failed:", err);
          return next(err);
        }
        console.log("✅ Login successful:", user.username);
        res.status(200).json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}
