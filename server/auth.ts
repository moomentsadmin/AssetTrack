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

export async function hashPassword(password: string) {
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

export function setupAuth(router: import("express").Router) {
  const isProduction = process.env.NODE_ENV === 'production';
  const envSecure = process.env.SESSION_COOKIE_SECURE;
  const secureCookie = envSecure !== undefined ? envSecure === 'true' : isProduction;
  const sameSite: session.CookieOptions['sameSite'] = secureCookie ? 'none' : 'lax';
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      httpOnly: true,
      secure: secureCookie,
      sameSite,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  };


  
  router.use(session(sessionSettings));
  router.use(passport.initialize());
  router.use(passport.session());

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
  router.get("/api/setup/status", async (req, res) => {
    try {
      const settings = await storage.getSystemSettings();
      const setupCompleted = settings?.setupCompleted || false;
      res.json({ setupCompleted });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Initial setup - creates admin user with custom credentials
  router.post("/api/setup", async (req, res, next) => {
    try {
      const settings = await storage.getSystemSettings();
      if (settings?.setupCompleted) {
        return res.status(400).send("Setup already completed");
      }

      // Require custom admin credentials
      const { username, password, email, fullName } = req.body;
      
      if (!username || !password || !email || !fullName) {
        return res.status(400).send("All fields are required: username, password, email, fullName");
      }

      // Validate username length
      if (username.length < 3) {
        return res.status(400).send("Username must be at least 3 characters long");
      }

      // Validate password length
      if (password.length < 8) {
        return res.status(400).send("Password must be at least 8 characters long");
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).send("Invalid email address");
      }

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).send("Username already exists");
      }

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
        const { password: _pw, ...safeUser } = adminUser as any;
        res.status(201).json(safeUser);
      });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Register route (disabled - for admin use only)
  router.post("/api/register", async (req, res, next) => {
    return res.status(403).send("Registration is disabled. Please contact an administrator.");
  });

  router.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).send("Invalid credentials");
      }
      
      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        const { password: _pw, ...safeUser } = user as any;
        res.status(200).json(safeUser);
      });
    })(req, res, next);
  });

  router.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  router.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    if (!user) return res.sendStatus(401);
    const { password: _pw, ...safeUser } = user;
    res.json(safeUser);
  });
}
