import { pgTable, text, serial, integer, boolean, timestamp, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const cloudClusters = pgTable("cloud_clusters", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  coordinates: text("coordinates").notNull(),
  confidence: real("confidence").notNull(),
  precipitationProbability: real("precipitation_probability").notNull(),
  status: text("status").notNull(), // "Active", "Forming", "Dissipating", "High Risk"
  detectedAt: timestamp("detected_at").defaultNow(),
  movementSpeed: real("movement_speed"),
  area: real("area"),
  intensity: text("intensity"),
});

export const satelliteData = pgTable("satellite_data", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow(),
  dataSource: text("data_source").notNull(), // "MOSDAC", "Upload"
  imageUrl: text("image_url"),
  processedData: jsonb("processed_data"),
  qualityScore: real("quality_score"),
  region: text("region").notNull(),
});

export const systemStatus = pgTable("system_status", {
  id: serial("id").primaryKey(),
  component: text("component").notNull(), // "MOSDAC_API", "AI_MODELS", "DATA_PROCESSING"
  status: text("status").notNull(), // "Online", "Offline", "Processing", "Error"
  lastUpdated: timestamp("last_updated").defaultNow(),
  message: text("message"),
});

export const processingJobs = pgTable("processing_jobs", {
  id: serial("id").primaryKey(),
  jobType: text("job_type").notNull(), // "DATA_INGESTION", "AI_PROCESSING", "DATA_VALIDATION", "REPORT_GENERATION"
  status: text("status").notNull(), // "Pending", "Running", "Complete", "Failed"
  progress: integer("progress").default(0),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  metadata: jsonb("metadata"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertCloudClusterSchema = createInsertSchema(cloudClusters).omit({
  id: true,
  detectedAt: true,
});

export const insertSatelliteDataSchema = createInsertSchema(satelliteData).omit({
  id: true,
  timestamp: true,
});

export const insertSystemStatusSchema = createInsertSchema(systemStatus).omit({
  id: true,
  lastUpdated: true,
});

export const insertProcessingJobSchema = createInsertSchema(processingJobs).omit({
  id: true,
  startedAt: true,
  completedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type CloudCluster = typeof cloudClusters.$inferSelect;
export type InsertCloudCluster = z.infer<typeof insertCloudClusterSchema>;
export type SatelliteData = typeof satelliteData.$inferSelect;
export type InsertSatelliteData = z.infer<typeof insertSatelliteDataSchema>;
export type SystemStatus = typeof systemStatus.$inferSelect;
export type InsertSystemStatus = z.infer<typeof insertSystemStatusSchema>;
export type ProcessingJob = typeof processingJobs.$inferSelect;
export type InsertProcessingJob = z.infer<typeof insertProcessingJobSchema>;
