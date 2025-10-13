// Storage implementation with database from blueprint:javascript_auth_all_persistance and javascript_database
import { 
  users, assets, departments, assetAssignments, assetNotes, auditTrail, 
  customFieldDefinitions, emailSettings,
  type User, type InsertUser, type Asset, type InsertAsset,
  type Department, type InsertDepartment, type AssetAssignment, type InsertAssetAssignment,
  type AssetNote, type InsertAssetNote, type AuditTrail, type InsertAuditTrail,
  type CustomFieldDefinition, type InsertCustomFieldDefinition,
  type EmailSettings, type InsertEmailSettings
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
}

export const storage = new DatabaseStorage();
