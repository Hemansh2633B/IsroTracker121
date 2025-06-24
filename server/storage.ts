import { 
  users, 
  cloudClusters, 
  satelliteData, 
  systemStatus, 
  processingJobs,
  type User, 
  type InsertUser,
  type CloudCluster,
  type InsertCloudCluster,
  type SatelliteData,
  type InsertSatelliteData,
  type SystemStatus,
  type InsertSystemStatus,
  type ProcessingJob,
  type InsertProcessingJob
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Cloud cluster methods
  getCloudClusters(): Promise<CloudCluster[]>;
  getCloudCluster(id: number): Promise<CloudCluster | undefined>;
  createCloudCluster(cluster: InsertCloudCluster): Promise<CloudCluster>;
  updateCloudCluster(id: number, cluster: Partial<InsertCloudCluster>): Promise<CloudCluster | undefined>;
  
  // Satellite data methods
  getSatelliteData(): Promise<SatelliteData[]>;
  createSatelliteData(data: InsertSatelliteData): Promise<SatelliteData>;
  
  // System status methods
  getSystemStatus(): Promise<SystemStatus[]>;
  updateSystemStatus(component: string, status: InsertSystemStatus): Promise<SystemStatus>;
  
  // Processing job methods
  getProcessingJobs(): Promise<ProcessingJob[]>;
  createProcessingJob(job: InsertProcessingJob): Promise<ProcessingJob>;
  updateProcessingJob(id: number, job: Partial<InsertProcessingJob>): Promise<ProcessingJob | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private cloudClusters: Map<number, CloudCluster>;
  private satelliteData: Map<number, SatelliteData>;
  private systemStatus: Map<string, SystemStatus>;
  private processingJobs: Map<number, ProcessingJob>;
  private currentId: number;

  constructor() {
    this.users = new Map();
    this.cloudClusters = new Map();
    this.satelliteData = new Map();
    this.systemStatus = new Map();
    this.processingJobs = new Map();
    this.currentId = 1;
    
    // Initialize with sample system status
    this.initializeSystemStatus();
    this.initializeSampleData();
  }

  private initializeSystemStatus() {
    const statuses: InsertSystemStatus[] = [
      { component: "MOSDAC_API", status: "Online", message: "Connected to MOSDAC API" },
      { component: "AI_MODELS", status: "Online", message: "All AI models loaded and active" },
      { component: "DATA_PROCESSING", status: "Processing", message: "Processing satellite imagery" }
    ];

    statuses.forEach(status => {
      this.systemStatus.set(status.component, {
        id: this.currentId++,
        ...status,
        message: status.message || null,
        lastUpdated: new Date()
      });
    });
  }

  private initializeSampleData() {
    // Initialize sample cloud clusters
    const sampleClusters: InsertCloudCluster[] = [
      {
        name: "TC-247",
        coordinates: "15.2°N, 68.4°E",
        confidence: 0.94,
        precipitationProbability: 0.78,
        status: "Active",
        movementSpeed: 12,
        area: 2500,
        intensity: "Moderate"
      },
      {
        name: "TC-146",
        coordinates: "18.7°N, 72.1°E",
        confidence: 0.87,
        precipitationProbability: 0.45,
        status: "Forming",
        movementSpeed: 8,
        area: 1800,
        intensity: "Low"
      },
      {
        name: "TC-091",
        coordinates: "12.4°N, 85.2°E",
        confidence: 0.96,
        precipitationProbability: 0.92,
        status: "High Risk",
        movementSpeed: 15,
        area: 3200,
        intensity: "High"
      }
    ];

    sampleClusters.forEach(cluster => {
      this.cloudClusters.set(this.currentId, {
        id: this.currentId++,
        ...cluster,
        area: cluster.area || null,
        movementSpeed: cluster.movementSpeed || null,
        intensity: cluster.intensity || null,
        detectedAt: new Date()
      });
    });

    // Initialize processing jobs
    const sampleJobs: InsertProcessingJob[] = [
      {
        jobType: "DATA_INGESTION",
        status: "Complete",
        progress: 100,
        metadata: { source: "MOSDAC API", recordsProcessed: 12450 }
      },
      {
        jobType: "AI_PROCESSING",
        status: "Running",
        progress: 67,
        metadata: { modelsRunning: ["U-Net", "ConvLSTM"], imagesProcessed: 842 }
      },
      {
        jobType: "DATA_VALIDATION",
        status: "Pending",
        progress: 0,
        metadata: {}
      },
      {
        jobType: "REPORT_GENERATION",
        status: "Pending", 
        progress: 0,
        metadata: {}
      }
    ];

    sampleJobs.forEach(job => {
      this.processingJobs.set(this.currentId, {
        id: this.currentId++,
        ...job,
        progress: job.progress || null,
        metadata: job.metadata || null,
        startedAt: job.status !== "Pending" ? new Date() : null,
        completedAt: job.status === "Complete" ? new Date() : null
      });
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Cloud cluster methods
  async getCloudClusters(): Promise<CloudCluster[]> {
    return Array.from(this.cloudClusters.values());
  }

  async getCloudCluster(id: number): Promise<CloudCluster | undefined> {
    return this.cloudClusters.get(id);
  }

  async createCloudCluster(cluster: InsertCloudCluster): Promise<CloudCluster> {
    const id = this.currentId++;
    const newCluster: CloudCluster = {
      id,
      ...cluster,
      area: cluster.area || null,
      movementSpeed: cluster.movementSpeed || null,
      intensity: cluster.intensity || null,
      detectedAt: new Date()
    };
    this.cloudClusters.set(id, newCluster);
    return newCluster;
  }

  async updateCloudCluster(id: number, cluster: Partial<InsertCloudCluster>): Promise<CloudCluster | undefined> {
    const existing = this.cloudClusters.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...cluster };
    this.cloudClusters.set(id, updated);
    return updated;
  }

  // Satellite data methods
  async getSatelliteData(): Promise<SatelliteData[]> {
    return Array.from(this.satelliteData.values());
  }

  async createSatelliteData(data: InsertSatelliteData): Promise<SatelliteData> {
    const id = this.currentId++;
    const newData: SatelliteData = {
      id,
      ...data,
      imageUrl: data.imageUrl || null,
      processedData: data.processedData || null,
      qualityScore: data.qualityScore || null,
      timestamp: new Date()
    };
    this.satelliteData.set(id, newData);
    return newData;
  }

  // System status methods
  async getSystemStatus(): Promise<SystemStatus[]> {
    return Array.from(this.systemStatus.values());
  }

  async updateSystemStatus(component: string, status: InsertSystemStatus): Promise<SystemStatus> {
    const existing = this.systemStatus.get(component);
    const id = existing?.id || this.currentId++;
    
    const updated: SystemStatus = {
      id,
      ...status,
      component,
      message: status.message || null,
      lastUpdated: new Date()
    };
    
    this.systemStatus.set(component, updated);
    return updated;
  }

  // Processing job methods
  async getProcessingJobs(): Promise<ProcessingJob[]> {
    return Array.from(this.processingJobs.values());
  }

  async createProcessingJob(job: InsertProcessingJob): Promise<ProcessingJob> {
    const id = this.currentId++;
    const newJob: ProcessingJob = {
      id,
      ...job,
      progress: job.progress || null,
      metadata: job.metadata || null,
      startedAt: job.status === "Running" ? new Date() : null,
      completedAt: null
    };
    this.processingJobs.set(id, newJob);
    return newJob;
  }

  async updateProcessingJob(id: number, job: Partial<InsertProcessingJob>): Promise<ProcessingJob | undefined> {
    const existing = this.processingJobs.get(id);
    if (!existing) return undefined;
    
    const updated = { 
      ...existing, 
      ...job,
      startedAt: job.status === "Running" && !existing.startedAt ? new Date() : existing.startedAt,
      completedAt: job.status === "Complete" ? new Date() : existing.completedAt
    };
    this.processingJobs.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
