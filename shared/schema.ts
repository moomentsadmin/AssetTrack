import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, decimal, jsonb, pgEnum, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum("user_role", ["admin", "manager", "employee"]);
export const assetTypeEnum = pgEnum("asset_type", ["hardware", "software", "license", "accessory", "office_equipment", "vehicle"]);
export const assetStatusEnum = pgEnum("asset_status", ["available", "assigned", "in_maintenance", "retired", "lost", "disposed"]);
export const depreciationMethodEnum = pgEnum("depreciation_method", ["straight_line", "declining_balance"]);

// Users table - authentication from blueprint:javascript_auth_all_persistance
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  role: userRoleEnum("role").notNull().default("employee"),
  department: text("department"),
  isContractor: boolean("is_contractor").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Departments table
export const departments = pgTable("departments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Locations table
export const locations = pgTable("locations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  currency: text("currency").notNull().default("USD"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Asset Types table (replaces hardcoded enum for flexibility)
export const assetTypes = pgTable("asset_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Assets table
export const assets = pgTable("assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  assetTypeId: varchar("asset_type_id").notNull().references(() => assetTypes.id),
  status: assetStatusEnum("status").notNull().default("available"),
  serialNumber: text("serial_number"),
  model: text("model"),
  manufacturer: text("manufacturer"),
  purchaseDate: timestamp("purchase_date"),
  purchaseCost: decimal("purchase_cost", { precision: 10, scale: 2 }),
  warrantyExpiry: timestamp("warranty_expiry"),
  condition: text("condition"),
  photoUrl: text("photo_url"),
  locationId: varchar("location_id").notNull().references(() => locations.id),
  departmentId: varchar("department_id").references(() => departments.id),
  customFields: jsonb("custom_fields"),
  depreciationMethod: depreciationMethodEnum("depreciation_method"),
  depreciationRate: decimal("depreciation_rate", { precision: 5, scale: 2 }),
  currentValue: decimal("current_value", { precision: 10, scale: 2 }),
  // Additional tracking fields
  assetTag: text("asset_tag"),
  priority: text("priority"),
  employeeId: text("employee_id"),
  companyClient: text("company_client"),
  mobileNumber: text("mobile_number"),
  internalMailId: text("internal_mail_id"),
  clientMailId: text("client_mail_id"),
  expressServiceCode: text("express_service_code"),
  adapterSn: text("adapter_sn"),
  processor: text("processor"),
  ram: text("ram"),
  storage: text("storage"),
  laptopAssignedDate: timestamp("laptop_assigned_date"),
  license: text("license"),
  acknowledgementForm: text("acknowledgement_form"),
  oldLaptop: text("old_laptop"),
  supplierName: text("supplier_name"),
  invoiceNo: text("invoice_no"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Asset Assignments table
export const assetAssignments = pgTable("asset_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assetId: varchar("asset_id").notNull().references(() => assets.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  assignedAt: timestamp("assigned_at").notNull().defaultNow(),
  returnedAt: timestamp("returned_at"),
  expectedReturnDate: timestamp("expected_return_date"),
  assignedBy: varchar("assigned_by").notNull().references(() => users.id),
  notes: text("notes"),
});

// Asset Notes table
export const assetNotes = pgTable("asset_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assetId: varchar("asset_id").notNull().references(() => assets.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  note: text("note").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Audit Trail table
export const auditTrail = pgTable("audit_trail", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assetId: varchar("asset_id").references(() => assets.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  action: text("action").notNull(),
  details: jsonb("details"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Custom Field Definitions table
export const customFieldDefinitions = pgTable("custom_field_definitions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assetTypeId: varchar("asset_type_id").notNull().references(() => assetTypes.id),
  fieldName: text("field_name").notNull(),
  fieldType: text("field_type").notNull(), // text, number, date, boolean, select
  fieldOptions: jsonb("field_options"), // for select type
  isRequired: boolean("is_required").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Email Settings table
export const emailSettings = pgTable("email_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  provider: text("provider").notNull(), // sendgrid, smtp
  smtpHost: text("smtp_host"),
  smtpPort: integer("smtp_port"),
  smtpUser: text("smtp_user"),
  smtpPassword: text("smtp_password"),
  sendgridApiKey: text("sendgrid_api_key"),
  fromEmail: text("from_email").notNull(),
  fromName: text("from_name").notNull(),
  warrantyExpiryEnabled: boolean("warranty_expiry_enabled").notNull().default(true),
  assignmentEnabled: boolean("assignment_enabled").notNull().default(true),
  returnReminderEnabled: boolean("return_reminder_enabled").notNull().default(true),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// System Settings table
export const systemSettings = pgTable("system_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  setupCompleted: boolean("setup_completed").notNull().default(false),
  companyName: text("company_name"),
  companyWebsite: text("company_website"),
  companyLogo: text("company_logo"),
  headerText: text("header_text"),
  footerText: text("footer_text"),
  headerLinks: jsonb("header_links"),
  footerLinks: jsonb("footer_links"),
  defaultCurrency: text("default_currency").notNull().default("USD"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Device Tracking table - stores current status of tracked devices
export const deviceTracking = pgTable("device_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assetId: varchar("asset_id").notNull().references(() => assets.id, { onDelete: "cascade" }).unique(),
  trackingToken: text("tracking_token").notNull().unique(),
  isActive: boolean("is_active").notNull().default(true),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  ipAddress: text("ip_address"),
  hostname: text("hostname"),
  cpuUsage: decimal("cpu_usage", { precision: 5, scale: 2 }),
  memoryUsage: decimal("memory_usage", { precision: 5, scale: 2 }),
  memoryTotal: decimal("memory_total", { precision: 10, scale: 2 }),
  diskUsage: decimal("disk_usage", { precision: 5, scale: 2 }),
  diskTotal: decimal("disk_total", { precision: 10, scale: 2 }),
  osInfo: text("os_info"),
  lastHeartbeat: timestamp("last_heartbeat").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Device Tracking History table - stores historical tracking data
export const deviceTrackingHistory = pgTable("device_tracking_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  deviceTrackingId: varchar("device_tracking_id").notNull().references(() => deviceTracking.id, { onDelete: "cascade" }),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  ipAddress: text("ip_address"),
  cpuUsage: decimal("cpu_usage", { precision: 5, scale: 2 }),
  memoryUsage: decimal("memory_usage", { precision: 5, scale: 2 }),
  diskUsage: decimal("disk_usage", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  assignedAssets: many(assetAssignments),
  notes: many(assetNotes),
  auditTrail: many(auditTrail),
}));

export const departmentsRelations = relations(departments, ({ many }) => ({
  assets: many(assets),
}));

export const locationsRelations = relations(locations, ({ many }) => ({
  assets: many(assets),
}));

export const assetTypesRelations = relations(assetTypes, ({ many }) => ({
  assets: many(assets),
  customFieldDefinitions: many(customFieldDefinitions),
}));

export const assetsRelations = relations(assets, ({ one, many }) => ({
  department: one(departments, {
    fields: [assets.departmentId],
    references: [departments.id],
  }),
  location: one(locations, {
    fields: [assets.locationId],
    references: [locations.id],
  }),
  assetType: one(assetTypes, {
    fields: [assets.assetTypeId],
    references: [assetTypes.id],
  }),
  assignments: many(assetAssignments),
  notes: many(assetNotes),
  auditTrail: many(auditTrail),
  deviceTracking: one(deviceTracking, {
    fields: [assets.id],
    references: [deviceTracking.assetId],
  }),
}));

export const customFieldDefinitionsRelations = relations(customFieldDefinitions, ({ one }) => ({
  assetType: one(assetTypes, {
    fields: [customFieldDefinitions.assetTypeId],
    references: [assetTypes.id],
  }),
}));

export const assetAssignmentsRelations = relations(assetAssignments, ({ one }) => ({
  asset: one(assets, {
    fields: [assetAssignments.assetId],
    references: [assets.id],
  }),
  user: one(users, {
    fields: [assetAssignments.userId],
    references: [users.id],
  }),
  assignedByUser: one(users, {
    fields: [assetAssignments.assignedBy],
    references: [users.id],
  }),
}));

export const assetNotesRelations = relations(assetNotes, ({ one }) => ({
  asset: one(assets, {
    fields: [assetNotes.assetId],
    references: [assets.id],
  }),
  user: one(users, {
    fields: [assetNotes.userId],
    references: [users.id],
  }),
}));

export const auditTrailRelations = relations(auditTrail, ({ one }) => ({
  asset: one(assets, {
    fields: [auditTrail.assetId],
    references: [assets.id],
  }),
  user: one(users, {
    fields: [auditTrail.userId],
    references: [users.id],
  }),
}));

export const deviceTrackingRelations = relations(deviceTracking, ({ one, many }) => ({
  asset: one(assets, {
    fields: [deviceTracking.assetId],
    references: [assets.id],
  }),
  history: many(deviceTrackingHistory),
}));

export const deviceTrackingHistoryRelations = relations(deviceTrackingHistory, ({ one }) => ({
  deviceTracking: one(deviceTracking, {
    fields: [deviceTrackingHistory.deviceTrackingId],
    references: [deviceTracking.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
  role: true,
  department: true,
  isContractor: true,
});

export const insertDepartmentSchema = createInsertSchema(departments).omit({
  id: true,
  createdAt: true,
});

export const insertLocationSchema = createInsertSchema(locations).omit({
  id: true,
  createdAt: true,
});

export const insertAssetTypeSchema = createInsertSchema(assetTypes).omit({
  id: true,
  createdAt: true,
});

export const insertAssetSchema = createInsertSchema(assets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  currentValue: true,
}).extend({
  assetTag: z.string().optional(),
  priority: z.string().optional(),
  employeeId: z.string().optional(),
  companyClient: z.string().optional(),
  mobileNumber: z.string().optional(),
  internalMailId: z.string().optional(),
  clientMailId: z.string().optional(),
  expressServiceCode: z.string().optional(),
  adapterSn: z.string().optional(),
  processor: z.string().optional(),
  ram: z.string().optional(),
  storage: z.string().optional(),
  laptopAssignedDate: z.date().optional().nullable(),
  license: z.string().optional(),
  acknowledgementForm: z.string().optional(),
  oldLaptop: z.string().optional(),
  supplierName: z.string().optional(),
  invoiceNo: z.string().optional(),
});

export const insertAssetAssignmentSchema = createInsertSchema(assetAssignments).omit({
  id: true,
  assignedAt: true,
});

export const insertAssetNoteSchema = createInsertSchema(assetNotes).omit({
  id: true,
  createdAt: true,
});

export const insertAuditTrailSchema = createInsertSchema(auditTrail).omit({
  id: true,
  createdAt: true,
});

export const insertCustomFieldDefinitionSchema = createInsertSchema(customFieldDefinitions).omit({
  id: true,
  createdAt: true,
});

export const insertEmailSettingsSchema = createInsertSchema(emailSettings).omit({
  id: true,
  updatedAt: true,
});

export const insertSystemSettingsSchema = createInsertSchema(systemSettings).omit({
  id: true,
  updatedAt: true,
});

export const insertDeviceTrackingSchema = createInsertSchema(deviceTracking).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastHeartbeat: true,
});

export const insertDeviceTrackingHistorySchema = createInsertSchema(deviceTrackingHistory).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type Department = typeof departments.$inferSelect;

export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type Location = typeof locations.$inferSelect;

export type InsertAssetType = z.infer<typeof insertAssetTypeSchema>;
export type AssetType = typeof assetTypes.$inferSelect;

export type InsertAsset = z.infer<typeof insertAssetSchema>;
export type Asset = typeof assets.$inferSelect;

export type InsertAssetAssignment = z.infer<typeof insertAssetAssignmentSchema>;
export type AssetAssignment = typeof assetAssignments.$inferSelect;

export type InsertAssetNote = z.infer<typeof insertAssetNoteSchema>;
export type AssetNote = typeof assetNotes.$inferSelect;

export type InsertAuditTrail = z.infer<typeof insertAuditTrailSchema>;
export type AuditTrail = typeof auditTrail.$inferSelect;

export type InsertCustomFieldDefinition = z.infer<typeof insertCustomFieldDefinitionSchema>;
export type CustomFieldDefinition = typeof customFieldDefinitions.$inferSelect;

export type InsertEmailSettings = z.infer<typeof insertEmailSettingsSchema>;
export type EmailSettings = typeof emailSettings.$inferSelect;

export type InsertSystemSettings = z.infer<typeof insertSystemSettingsSchema>;
export type SystemSettings = typeof systemSettings.$inferSelect;

export type InsertDeviceTracking = z.infer<typeof insertDeviceTrackingSchema>;
export type DeviceTracking = typeof deviceTracking.$inferSelect;

export type InsertDeviceTrackingHistory = z.infer<typeof insertDeviceTrackingHistorySchema>;
export type DeviceTrackingHistory = typeof deviceTrackingHistory.$inferSelect;
