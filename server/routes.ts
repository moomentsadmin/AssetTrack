import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import path from "path";
import { setupAuth } from "./auth";
import logger, { log } from "./logger";
import { storage } from "./storage";
import multer from "multer";
import Papa from "papaparse";
import bcrypt from "bcrypt";
import { sendAssignmentNotification } from "./email";
import { insertUserSchema } from "@shared/schema";

const upload = multer({ storage: multer.memoryStorage() });

// Middleware to check authentication
function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).send("Unauthorized");
  }
  next();
}

// Middleware to check admin/manager role
function requireAdminOrManager(req: any, res: any, next: any) {
  if (!req.user || (req.user.role !== "admin" && req.user.role !== "manager")) {
    return res.status(403).send("Forbidden");
  }
  next();
}

// Middleware to check admin role only
function requireAdmin(req: any, res: any, next: any) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).send("Forbidden - Admin access required");
  }
  next();
}

export function registerRoutes(app: Express): Server {
  // Setup authentication routes
  setupAuth(app);

  // Health check endpoint for container healthcheck
  app.get("/health", (req, res) => {
    res.status(200).json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // Device tracking feature fully removed. Static assets and related
  // endpoints have been deprecated and eliminated from the codebase.
  // ENV flag ENABLE_DEVICE_TRACKING is no longer used.

  // Users routes
  app.get("/api/users", requireAuth, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Remove passwords from response
      const sanitizedUsers = users.map(({ password, ...user }) => user);
      res.json(sanitizedUsers);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.post("/api/users", requireAuth, requireAdminOrManager, async (req, res) => {
    try {
      // Validate request body
      const validatedData = insertUserSchema.parse(req.body);
      const { password, ...userData } = validatedData;
      
      // Hash password before storing
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({ ...userData, password: hashedPassword });
      
      // Don't send password back
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).send(error.errors[0].message);
      }
      res.status(500).send(error.message);
    }
  });

  app.patch("/api/users/:id", requireAuth, async (req, res) => {
    try {
      // Check if user is updating their own profile or is an admin
      const isOwnProfile = req.user?.id === req.params.id;
      const isAdmin = req.user?.role === "admin";
      
      if (!isOwnProfile && !isAdmin) {
        return res.status(403).send("Forbidden - You can only update your own profile");
      }
      
      // Validate request body (password is optional for updates)
      const updateSchema = insertUserSchema.partial();
      const validatedData = updateSchema.parse(req.body) as any;
      const { password, ...rawUpdateData } = validatedData;
      
      let updateData: any = {};
      
      // Non-admin users can only update specific fields
      if (isOwnProfile && !isAdmin) {
        // Allow only: fullName, email, department
        const allowedFields = ['fullName', 'email', 'department'];
        for (const field of allowedFields) {
          if (rawUpdateData[field] !== undefined) {
            updateData[field] = rawUpdateData[field];
          }
        }
      } else if (isAdmin) {
        // Admin can update all fields
        updateData = rawUpdateData;
      }
      
      // If password is being updated, hash it and add to update data
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const finalUpdateData = { ...updateData, password: hashedPassword };
        const user = await storage.updateUser(req.params.id, finalUpdateData);
        if (!user) return res.status(404).send("User not found");
        
        // Don't send password back
        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      } else {
        const user = await storage.updateUser(req.params.id, updateData);
        if (!user) return res.status(404).send("User not found");
        
        // Don't send password back
        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      }
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).send(error.errors[0].message);
      }
      res.status(500).send(error.message);
    }
  });

  app.delete("/api/users/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      // Prevent deleting yourself
      if (req.params.id === req.user?.id) {
        return res.status(400).send("Cannot delete your own account");
      }
      await storage.deleteUser(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Assets routes
  app.get("/api/assets", requireAuth, async (req, res) => {
    try {
      const assets = await storage.getAllAssets();
      res.json(assets);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.get("/api/assets/:id", requireAuth, async (req, res) => {
    try {
      const asset = await storage.getAsset(req.params.id);
      if (!asset) return res.status(404).send("Asset not found");
      res.json(asset);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.post("/api/assets", requireAuth, async (req, res) => {
    try {
      // Convert date strings to Date objects, excluding them from the spread
      const { purchaseDate, warrantyExpiry, ...rest } = req.body;
      const assetData = {
        ...rest,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : null,
      };

      const asset = await storage.createAsset(assetData);
      
      // Create audit entry
      await storage.createAuditEntry({
        assetId: asset.id,
        userId: req.user!.id,
        action: "Asset created",
        details: { assetName: asset.name, assetType: asset.assetType },
      });

      res.status(201).json(asset);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.patch("/api/assets/:id", requireAuth, async (req, res) => {
    try {
      // Convert date strings to Date objects, excluding them from the spread
      const { purchaseDate, warrantyExpiry, ...rest } = req.body;
      const updateData: any = { ...rest };
      
      if (purchaseDate !== undefined) {
        updateData.purchaseDate = purchaseDate ? new Date(purchaseDate) : null;
      }
      if (warrantyExpiry !== undefined) {
        updateData.warrantyExpiry = warrantyExpiry ? new Date(warrantyExpiry) : null;
      }

      const asset = await storage.updateAsset(req.params.id, updateData);
      if (!asset) return res.status(404).send("Asset not found");

      // Create audit entry
      await storage.createAuditEntry({
        assetId: asset.id,
        userId: req.user!.id,
        action: "Asset updated",
        details: { changes: req.body },
      });

      res.json(asset);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.delete("/api/assets/:id", requireAuth, requireAdminOrManager, async (req, res) => {
    try {
      const asset = await storage.getAsset(req.params.id);
      if (!asset) return res.status(404).send("Asset not found");

      await storage.deleteAsset(req.params.id);

      // Create audit entry
      await storage.createAuditEntry({
        assetId: null,
        userId: req.user!.id,
        action: "Asset deleted",
        details: { assetName: asset.name, assetId: req.params.id },
      });

      res.sendStatus(204);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Asset depreciation calculation
  app.patch("/api/assets/:id/depreciation", requireAuth, async (req, res) => {
    try {
      const asset = await storage.getAsset(req.params.id);
      if (!asset) return res.status(404).send("Asset not found");

      const { depreciationMethod, depreciationRate, yearsOfUse } = req.body;
      const purchaseCost = Number(asset.purchaseCost || 0);
      const rate = Number(depreciationRate || 0);
      const years = Number(yearsOfUse || 0);

      let currentValue = purchaseCost;
      if (purchaseCost && rate && years) {
        if (depreciationMethod === "straight_line") {
          currentValue = Math.max(0, purchaseCost - (purchaseCost * (rate / 100) * years));
        } else if (depreciationMethod === "declining_balance") {
          currentValue = purchaseCost * Math.pow(1 - rate / 100, years);
        }
      }

      const updatedAsset = await storage.updateAsset(req.params.id, {
        depreciationMethod,
        depreciationRate,
        currentValue: currentValue.toFixed(2),
      } as any);

      // Create audit entry
      await storage.createAuditEntry({
        assetId: req.params.id,
        userId: req.user!.id,
        action: "Depreciation updated",
        details: {
          assetName: asset.name,
          method: depreciationMethod,
          rate: depreciationRate,
          yearsOfUse: yearsOfUse,
          currentValue: currentValue.toFixed(2),
        },
      });

      res.json(updatedAsset);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Auto-calculate depreciation based on purchase date
  app.post("/api/assets/:id/calculate-depreciation", requireAuth, async (req, res) => {
    try {
      const asset = await storage.getAsset(req.params.id);
      if (!asset) return res.status(404).send("Asset not found");

      if (!asset.purchaseDate || !asset.depreciationMethod || !asset.depreciationRate) {
        return res.status(400).send("Asset must have purchase date, depreciation method, and rate");
      }

      const purchaseCost = Number(asset.purchaseCost || 0);
      const rate = Number(asset.depreciationRate || 0);
      const yearsSincePurchase = (Date.now() - new Date(asset.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365);

      let currentValue = purchaseCost;
      if (asset.depreciationMethod === "straight_line") {
        currentValue = Math.max(0, purchaseCost - (purchaseCost * (rate / 100) * yearsSincePurchase));
      } else if (asset.depreciationMethod === "declining_balance") {
        currentValue = purchaseCost * Math.pow(1 - rate / 100, yearsSincePurchase);
      }

      const updatedAsset = await storage.updateAsset(req.params.id, {
        currentValue: currentValue.toFixed(2),
      } as any);

      // Create audit entry
      await storage.createAuditEntry({
        assetId: req.params.id,
        userId: req.user!.id,
        action: "Depreciation auto-calculated",
        details: {
          assetName: asset.name,
          method: asset.depreciationMethod,
          yearsSincePurchase: yearsSincePurchase.toFixed(2),
          currentValue: currentValue.toFixed(2),
        },
      });

      res.json(updatedAsset);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Departments routes
  app.get("/api/departments", requireAuth, async (req, res) => {
    try {
      const departments = await storage.getAllDepartments();
      res.json(departments);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.post("/api/departments", requireAuth, requireAdminOrManager, async (req, res) => {
    try {
      const department = await storage.createDepartment(req.body);
      res.status(201).json(department);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.patch("/api/departments/:id", requireAuth, requireAdminOrManager, async (req, res) => {
    try {
      const department = await storage.updateDepartment(req.params.id, req.body);
      if (!department) return res.status(404).send("Department not found");
      res.json(department);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.delete("/api/departments/:id", requireAuth, requireAdminOrManager, async (req, res) => {
    try {
      await storage.deleteDepartment(req.params.id);
      res.sendStatus(204);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Locations routes
  app.get("/api/locations", requireAuth, async (req, res) => {
    try {
      const locations = await storage.getAllLocations();
      res.json(locations);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.post("/api/locations", requireAuth, requireAdminOrManager, async (req, res) => {
    try {
      const location = await storage.createLocation(req.body);
      res.status(201).json(location);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.patch("/api/locations/:id", requireAuth, requireAdminOrManager, async (req, res) => {
    try {
      const location = await storage.updateLocation(req.params.id, req.body);
      if (!location) return res.status(404).send("Location not found");
      res.json(location);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.delete("/api/locations/:id", requireAuth, requireAdminOrManager, async (req, res) => {
    try {
      await storage.deleteLocation(req.params.id);
      res.sendStatus(204);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Asset Types routes
  app.get("/api/asset-types", requireAuth, async (req, res) => {
    try {
      const assetTypes = await storage.getAllAssetTypes();
      res.json(assetTypes);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.post("/api/asset-types", requireAuth, requireAdminOrManager, async (req, res) => {
    try {
      const assetType = await storage.createAssetType(req.body);
      res.status(201).json(assetType);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.patch("/api/asset-types/:id", requireAuth, requireAdminOrManager, async (req, res) => {
    try {
      const assetType = await storage.updateAssetType(req.params.id, req.body);
      if (!assetType) return res.status(404).send("Asset type not found");
      res.json(assetType);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.delete("/api/asset-types/:id", requireAuth, requireAdminOrManager, async (req, res) => {
    try {
      await storage.deleteAssetType(req.params.id);
      res.sendStatus(204);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Assignments routes
  app.get("/api/assignments", requireAuth, async (req, res) => {
    try {
      const assignments = await storage.getAllAssignments();
      res.json(assignments);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.post("/api/assignments", requireAuth, async (req, res) => {
    try {
      // Ensure expectedReturnDate is a JS Date (drizzle/pg expects Date for timestamp columns)
      let expectedReturnDate: Date | null = null;
      if (req.body && req.body.expectedReturnDate) {
        const parsed = new Date(req.body.expectedReturnDate);
        expectedReturnDate = isNaN(parsed.getTime()) ? null : parsed;
      }

      const payload = { ...req.body, expectedReturnDate };

      log(`Creating assignment payload: ${JSON.stringify({ assetId: payload.assetId, userId: payload.userId, expectedReturnDate: payload.expectedReturnDate })}`, "routes");

      const assignment = await storage.createAssignment(payload);
      
      // Update asset status to assigned
      await storage.updateAsset(payload.assetId, { status: "assigned" });

      // Create audit entry
      const asset = await storage.getAsset(payload.assetId);
      const user = await storage.getUser(payload.userId);
      await storage.createAuditEntry({
        assetId: req.body.assetId,
        userId: req.user!.id,
        action: "Asset assigned",
        details: {
          assignedTo: user?.fullName,
          assetName: asset?.name,
        },
      });

      // Send email notification
      if (user && asset) {
        sendAssignmentNotification(user.email, user.fullName, asset.name).catch(() => {});
      }

      res.status(201).json(assignment);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.patch("/api/assignments/:id/return", requireAuth, async (req, res) => {
    try {
      const assignment = await storage.getAssignment(req.params.id);
      if (!assignment) return res.status(404).send("Assignment not found");

      const updated = await storage.returnAsset(req.params.id);
      
      // Update asset status to available
      await storage.updateAsset(assignment.assetId, { status: "available" });

      // Create audit entry
      await storage.createAuditEntry({
        assetId: assignment.assetId,
        userId: req.user!.id,
        action: "Asset returned",
        details: { assignmentId: req.params.id },
      });

      res.json(updated);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Asset notes routes
  app.get("/api/assets/:id/notes", requireAuth, async (req, res) => {
    try {
      const notes = await storage.getAssetNotes(req.params.id);
      res.json(notes);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.post("/api/assets/:id/notes", requireAuth, async (req, res) => {
    try {
      const note = await storage.createAssetNote({
        ...req.body,
        assetId: req.params.id,
      });

      // Create audit entry
      await storage.createAuditEntry({
        assetId: req.params.id,
        userId: req.user!.id,
        action: "Note added",
        details: { notePreview: req.body.note.substring(0, 50) },
      });

      res.status(201).json(note);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Audit trail routes
  app.get("/api/audit", requireAuth, async (req, res) => {
    try {
      const trail = await storage.getAllAuditTrail();
      res.json(trail);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Custom fields routes
  app.get("/api/custom-fields", requireAuth, async (req, res) => {
    try {
      const fields = await storage.getAllCustomFields();
      res.json(fields);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.post("/api/custom-fields", requireAuth, requireAdminOrManager, async (req, res) => {
    try {
      const field = await storage.createCustomField(req.body);
      res.status(201).json(field);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.delete("/api/custom-fields/:id", requireAuth, requireAdminOrManager, async (req, res) => {
    try {
      await storage.deleteCustomField(req.params.id);
      res.sendStatus(204);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Email settings routes
  app.get("/api/settings/email", requireAuth, async (req, res) => {
    try {
      const settings = await storage.getEmailSettings();
      res.json(settings || {
        provider: "smtp",
        fromEmail: "",
        fromName: "",
        warrantyExpiryEnabled: true,
        assignmentEnabled: true,
        returnReminderEnabled: true,
      });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.post("/api/settings/email", requireAuth, requireAdminOrManager, async (req, res) => {
    try {
      const settings = await storage.saveEmailSettings(req.body);
      res.json(settings);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // System settings routes (public for branding on login page)
  app.get("/api/settings/system", async (req, res) => {
    try {
      const settings = await storage.getSystemSettings();
      res.json(settings || {
        setupCompleted: false,
        companyName: "",
        companyWebsite: "",
        companyLogo: "",
        defaultCurrency: "USD",
        headerText: "",
        footerText: "",
      });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.post("/api/settings/system", requireAuth, requireAdminOrManager, async (req, res) => {
    try {
      const settings = await storage.saveSystemSettings(req.body);
      res.json(settings);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // CSV Import route
  // Bulk import users/employees
  app.post("/api/import/users", requireAuth, requireAdminOrManager, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).send("No file uploaded");
      }

      const fileContent = req.file.buffer.toString("utf-8");
      const parsed = Papa.parse(fileContent, { header: true, skipEmptyLines: true });

      let success = 0;
      let failed = 0;

      for (const row of parsed.data) {
        try {
          const data: any = row;
          
          // Validate required fields
          if (!data.fullName || !data.email || !data.username || !data.password || !data.role) {
            failed++;
            continue;
          }

          // Hash password
          const hashedPassword = await bcrypt.hash(data.password, 10);

          // Create user
          await storage.createUser({
            fullName: data.fullName,
            email: data.email,
            username: data.username,
            password: hashedPassword,
            role: data.role,
            department: data.department || null,
            isContractor: data.isContractor === "true" || data.isContractor === true,
          });

          success++;
        } catch (error: any) {
          failed++;
        }
      }

      // Create audit entry
      await storage.createAuditEntry({
        assetId: null,
        userId: req.user!.id,
        action: "Bulk user import completed",
        details: { success, failed, fileName: req.file.originalname },
      });

      res.json({ success, failed });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.post("/api/import/assets", requireAuth, requireAdminOrManager, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).send("No file uploaded");
      }

      const fileContent = req.file.buffer.toString("utf-8");
      const parsed = Papa.parse(fileContent, { header: true, skipEmptyLines: true });

      let success = 0;
      let failed = 0;

      for (const row of parsed.data) {
        try {
          const data: any = row;
          
          // Validate required fields
          if (!data.name || !data.assetType) {
            failed++;
            continue;
          }

          // Create asset
          await storage.createAsset({
            name: data.name,
            assetType: data.assetType,
            status: data.status || "available",
            serialNumber: data.serialNumber || null,
            model: data.model || null,
            manufacturer: data.manufacturer || null,
            purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
            purchaseCost: data.purchaseCost || null,
            warrantyExpiry: data.warrantyExpiry ? new Date(data.warrantyExpiry) : null,
            condition: data.condition || null,
            locationId: data.locationId || null,
            departmentId: data.departmentId || null,
            customFields: null,
            depreciationMethod: data.depreciationMethod || null,
            depreciationRate: data.depreciationRate || null,
          });

          success++;
        } catch (error: any) {
          failed++;
        }
      }

      // Create audit entry
      await storage.createAuditEntry({
        assetId: null,
        userId: req.user!.id,
        action: "Bulk import completed",
        details: { success, failed, fileName: req.file.originalname },
      });

      res.json({ success, failed });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Device-tracking endpoints removed in this branch. See docs/ for details.

  const httpServer = createServer(app);

  return httpServer;
}
