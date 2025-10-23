// Storage implementation with database from blueprint:javascript_auth_all_persistance and javascript_database
import { 
  users, assets, departments, locations, assetTypes, assetAssignments, assetNotes, auditTrail, 
  customFieldDefinitions, emailSettings, systemSettings, deviceTracking, deviceTrackingHistory,
  type User, type InsertUser, type Asset, type InsertAsset,
  type Department, type InsertDepartment, type Location, type InsertLocation,
  type AssetType, type InsertAssetType,
  type AssetAssignment, type InsertAssetAssignment,
  type AssetNote, type InsertAssetNote, type AuditTrail, type InsertAuditTrail,
  type CustomFieldDefinition, type InsertCustomFieldDefinition,
  type EmailSettings, type InsertEmailSettings,
  type SystemSettings, type InsertSystemSettings,
  type DeviceTracking, type InsertDeviceTracking,
  type DeviceTrackingHistory, type InsertDeviceTrackingHistory
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updateData: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;
  getAllUsers(): Promise<User[]>;

  // Asset methods
  getAllAssets(): Promise<Asset[]>;
  getAsset(id: string): Promise<Asset | undefined>;
  createAsset(asset: InsertAsset): Promise<Asset>;
  updateAsset(id: string, asset: Partial<InsertAsset>): Promise<Asset | undefined>;
  deleteAsset(id: string): Promise<void>;

  // Department methods
  getAllDepartments(): Promise<Department[]>;
  getDepartment(id: string): Promise<Department | undefined>;
  createDepartment(dept: InsertDepartment): Promise<Department>;
  updateDepartment(id: string, dept: Partial<InsertDepartment>): Promise<Department | undefined>;
  deleteDepartment(id: string): Promise<void>;

  // Location methods
  getAllLocations(): Promise<Location[]>;
  getLocation(id: string): Promise<Location | undefined>;
  createLocation(location: InsertLocation): Promise<Location>;
  updateLocation(id: string, location: Partial<InsertLocation>): Promise<Location | undefined>;
  deleteLocation(id: string): Promise<void>;

  // Asset Type methods
  getAllAssetTypes(): Promise<AssetType[]>;
  getAssetType(id: string): Promise<AssetType | undefined>;
  createAssetType(assetType: InsertAssetType): Promise<AssetType>;
  updateAssetType(id: string, assetType: Partial<InsertAssetType>): Promise<AssetType | undefined>;
  deleteAssetType(id: string): Promise<void>;

  // Assignment methods
  getAllAssignments(): Promise<AssetAssignment[]>;
  getAssignment(id: string): Promise<AssetAssignment | undefined>;
  createAssignment(assignment: InsertAssetAssignment): Promise<AssetAssignment>;
  returnAsset(assignmentId: string): Promise<AssetAssignment | undefined>;

  // Asset notes methods
  getAssetNotes(assetId: string): Promise<AssetNote[]>;
  createAssetNote(note: InsertAssetNote): Promise<AssetNote>;

  // Audit trail methods
  getAllAuditTrail(): Promise<AuditTrail[]>;
  createAuditEntry(entry: InsertAuditTrail): Promise<AuditTrail>;

  // Custom field methods
  getAllCustomFields(): Promise<CustomFieldDefinition[]>;
  createCustomField(field: InsertCustomFieldDefinition): Promise<CustomFieldDefinition>;
  deleteCustomField(id: string): Promise<void>;

  // Email settings methods
  getEmailSettings(): Promise<EmailSettings | undefined>;
  saveEmailSettings(settings: InsertEmailSettings): Promise<EmailSettings>;

  // System settings methods
  getSystemSettings(): Promise<SystemSettings | undefined>;
  saveSystemSettings(settings: InsertSystemSettings): Promise<SystemSettings>;

  // Device tracking methods
  getAllDeviceTracking(): Promise<DeviceTracking[]>;
  getDeviceTracking(id: string): Promise<DeviceTracking | undefined>;
  getDeviceTrackingByAssetId(assetId: string): Promise<DeviceTracking | undefined>;
  getDeviceTrackingByToken(token: string): Promise<DeviceTracking | undefined>;
  createDeviceTracking(tracking: InsertDeviceTracking): Promise<DeviceTracking>;
  updateDeviceTracking(id: string, tracking: Partial<InsertDeviceTracking>): Promise<DeviceTracking | undefined>;
  deleteDeviceTracking(id: string): Promise<void>;
  getDeviceTrackingHistory(deviceTrackingId: string): Promise<DeviceTrackingHistory[]>;
  createDeviceTrackingHistory(history: InsertDeviceTrackingHistory): Promise<DeviceTrackingHistory>;

  sessionStore: session.SessionStore;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ pool, createTableIfMissing: true });
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUser(id: string, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Asset methods
  async getAllAssets(): Promise<Asset[]> {
    return await db.select().from(assets).orderBy(desc(assets.createdAt));
  }

  async getAsset(id: string): Promise<Asset | undefined> {
    const [asset] = await db.select().from(assets).where(eq(assets.id, id));
    return asset || undefined;
  }

  async createAsset(insertAsset: InsertAsset): Promise<Asset> {
    const [asset] = await db.insert(assets).values(insertAsset).returning();
    return asset;
  }

  async updateAsset(id: string, updateData: Partial<InsertAsset>): Promise<Asset | undefined> {
    const [asset] = await db
      .update(assets)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(assets.id, id))
      .returning();
    return asset || undefined;
  }

  async deleteAsset(id: string): Promise<void> {
    await db.delete(assets).where(eq(assets.id, id));
  }

  // Department methods
  async getAllDepartments(): Promise<Department[]> {
    return await db.select().from(departments);
  }

  async getDepartment(id: string): Promise<Department | undefined> {
    const [dept] = await db.select().from(departments).where(eq(departments.id, id));
    return dept || undefined;
  }

  async createDepartment(insertDept: InsertDepartment): Promise<Department> {
    const [dept] = await db.insert(departments).values(insertDept).returning();
    return dept;
  }

  async updateDepartment(id: string, updateData: Partial<InsertDepartment>): Promise<Department | undefined> {
    const [dept] = await db
      .update(departments)
      .set(updateData)
      .where(eq(departments.id, id))
      .returning();
    return dept || undefined;
  }

  async deleteDepartment(id: string): Promise<void> {
    await db.delete(departments).where(eq(departments.id, id));
  }

  // Location methods
  async getAllLocations(): Promise<Location[]> {
    return await db.select().from(locations);
  }

  async getLocation(id: string): Promise<Location | undefined> {
    const [location] = await db.select().from(locations).where(eq(locations.id, id));
    return location || undefined;
  }

  async createLocation(insertLocation: InsertLocation): Promise<Location> {
    const [location] = await db.insert(locations).values(insertLocation).returning();
    return location;
  }

  async updateLocation(id: string, updateData: Partial<InsertLocation>): Promise<Location | undefined> {
    const [location] = await db
      .update(locations)
      .set(updateData)
      .where(eq(locations.id, id))
      .returning();
    return location || undefined;
  }

  async deleteLocation(id: string): Promise<void> {
    await db.delete(locations).where(eq(locations.id, id));
  }

  // Asset Type methods
  async getAllAssetTypes(): Promise<AssetType[]> {
    return await db.select().from(assetTypes).orderBy(assetTypes.name);
  }

  async getAssetType(id: string): Promise<AssetType | undefined> {
    const [assetType] = await db.select().from(assetTypes).where(eq(assetTypes.id, id));
    return assetType || undefined;
  }

  async createAssetType(insertAssetType: InsertAssetType): Promise<AssetType> {
    const [assetType] = await db.insert(assetTypes).values(insertAssetType).returning();
    return assetType;
  }

  async updateAssetType(id: string, updateData: Partial<InsertAssetType>): Promise<AssetType | undefined> {
    const [assetType] = await db
      .update(assetTypes)
      .set(updateData)
      .where(eq(assetTypes.id, id))
      .returning();
    return assetType || undefined;
  }

  async deleteAssetType(id: string): Promise<void> {
    await db.delete(assetTypes).where(eq(assetTypes.id, id));
  }

  // Assignment methods
  async getAllAssignments(): Promise<AssetAssignment[]> {
    return await db.select().from(assetAssignments).orderBy(desc(assetAssignments.assignedAt));
  }

  async getAssignment(id: string): Promise<AssetAssignment | undefined> {
    const [assignment] = await db.select().from(assetAssignments).where(eq(assetAssignments.id, id));
    return assignment || undefined;
  }

  async createAssignment(insertAssignment: InsertAssetAssignment): Promise<AssetAssignment> {
    const [assignment] = await db.insert(assetAssignments).values(insertAssignment).returning();
    return assignment;
  }

  async returnAsset(assignmentId: string): Promise<AssetAssignment | undefined> {
    const [assignment] = await db
      .update(assetAssignments)
      .set({ returnedAt: new Date() })
      .where(eq(assetAssignments.id, assignmentId))
      .returning();
    return assignment || undefined;
  }

  // Asset notes methods
  async getAssetNotes(assetId: string): Promise<AssetNote[]> {
    return await db.select().from(assetNotes).where(eq(assetNotes.assetId, assetId)).orderBy(desc(assetNotes.createdAt));
  }

  async createAssetNote(insertNote: InsertAssetNote): Promise<AssetNote> {
    const [note] = await db.insert(assetNotes).values(insertNote).returning();
    return note;
  }

  // Audit trail methods
  async getAllAuditTrail(): Promise<AuditTrail[]> {
    return await db.select().from(auditTrail).orderBy(desc(auditTrail.createdAt));
  }

  async createAuditEntry(insertEntry: InsertAuditTrail): Promise<AuditTrail> {
    const [entry] = await db.insert(auditTrail).values(insertEntry).returning();
    return entry;
  }

  // Custom field methods
  async getAllCustomFields(): Promise<CustomFieldDefinition[]> {
    return await db.select().from(customFieldDefinitions);
  }

  async createCustomField(insertField: InsertCustomFieldDefinition): Promise<CustomFieldDefinition> {
    const [field] = await db.insert(customFieldDefinitions).values(insertField).returning();
    return field;
  }

  async deleteCustomField(id: string): Promise<void> {
    await db.delete(customFieldDefinitions).where(eq(customFieldDefinitions.id, id));
  }

  // Email settings methods
  async getEmailSettings(): Promise<EmailSettings | undefined> {
    const [settings] = await db.select().from(emailSettings).limit(1);
    return settings || undefined;
  }

  async saveEmailSettings(insertSettings: InsertEmailSettings): Promise<EmailSettings> {
    const existing = await this.getEmailSettings();
    if (existing) {
      const [settings] = await db
        .update(emailSettings)
        .set({ ...insertSettings, updatedAt: new Date() })
        .where(eq(emailSettings.id, existing.id))
        .returning();
      return settings;
    } else {
      const [settings] = await db.insert(emailSettings).values(insertSettings).returning();
      return settings;
    }
  }

  // System settings methods
  async getSystemSettings(): Promise<SystemSettings | undefined> {
    const [settings] = await db.select().from(systemSettings).limit(1);
    return settings || undefined;
  }

  async saveSystemSettings(insertSettings: InsertSystemSettings): Promise<SystemSettings> {
    const existing = await this.getSystemSettings();
    if (existing) {
      const [settings] = await db
        .update(systemSettings)
        .set({ ...insertSettings, updatedAt: new Date() })
        .where(eq(systemSettings.id, existing.id))
        .returning();
      return settings;
    } else {
      const [settings] = await db.insert(systemSettings).values(insertSettings).returning();
      return settings;
    }
  }

  // Device tracking methods
  async getAllDeviceTracking(): Promise<DeviceTracking[]> {
    return await db.select().from(deviceTracking).orderBy(desc(deviceTracking.lastHeartbeat));
  }

  async getDeviceTracking(id: string): Promise<DeviceTracking | undefined> {
    const [tracking] = await db.select().from(deviceTracking).where(eq(deviceTracking.id, id));
    return tracking || undefined;
  }

  async getDeviceTrackingByAssetId(assetId: string): Promise<DeviceTracking | undefined> {
    const [tracking] = await db.select().from(deviceTracking).where(eq(deviceTracking.assetId, assetId));
    return tracking || undefined;
  }

  async getDeviceTrackingByToken(token: string): Promise<DeviceTracking | undefined> {
    const [tracking] = await db.select().from(deviceTracking).where(eq(deviceTracking.trackingToken, token));
    return tracking || undefined;
  }

  async createDeviceTracking(insertTracking: InsertDeviceTracking): Promise<DeviceTracking> {
    const [tracking] = await db.insert(deviceTracking).values(insertTracking).returning();
    return tracking;
  }

  async updateDeviceTracking(id: string, updateData: Partial<InsertDeviceTracking>): Promise<DeviceTracking | undefined> {
    const [tracking] = await db
      .update(deviceTracking)
      .set({ ...updateData, updatedAt: new Date(), lastHeartbeat: new Date() })
      .where(eq(deviceTracking.id, id))
      .returning();
    return tracking || undefined;
  }

  async deleteDeviceTracking(id: string): Promise<void> {
    await db.delete(deviceTracking).where(eq(deviceTracking.id, id));
  }

  async getDeviceTrackingHistory(deviceTrackingId: string): Promise<DeviceTrackingHistory[]> {
    return await db
      .select()
      .from(deviceTrackingHistory)
      .where(eq(deviceTrackingHistory.deviceTrackingId, deviceTrackingId))
      .orderBy(desc(deviceTrackingHistory.createdAt))
      .limit(100);
  }

  async createDeviceTrackingHistory(insertHistory: InsertDeviceTrackingHistory): Promise<DeviceTrackingHistory> {
    const [history] = await db.insert(deviceTrackingHistory).values(insertHistory).returning();
    return history;
  }
}

export const storage = new DatabaseStorage();
