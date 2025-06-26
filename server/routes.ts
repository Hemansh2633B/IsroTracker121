import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, StoredPushSubscription } from "./storage"; // Import StoredPushSubscription
import multer from "multer";
import { postUpcomingLaunchUpdate } from "./socialService";
import { sendPushNotificationToAll, PushNotificationPayload } from "./pushNotificationService"; // Import push service
import { z } from "zod";
import {
  insertCloudClusterSchema,
  insertSatelliteDataSchema,
  insertProcessingJobSchema,
  insertCommunityReportSchema // Added for community reports
} from "@shared/schema";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/tiff'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and TIFF images are allowed.'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Cloud clusters endpoints
  app.get("/api/cloud-clusters", async (req, res) => {
    try {
      const clusters = await storage.getCloudClusters();
      res.json(clusters);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cloud clusters" });
    }
  });

  app.post("/api/cloud-clusters", async (req, res) => {
    try {
      const cluster = insertCloudClusterSchema.parse(req.body);
      const newCluster = await storage.createCloudCluster(cluster);
      res.json(newCluster);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid cloud cluster data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create cloud cluster" });
      }
    }
  });

  // System status endpoints
  app.get("/api/system-status", async (req, res) => {
    try {
      const status = await storage.getSystemStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch system status" });
    }
  });

  // Processing jobs endpoints
  app.get("/api/processing-jobs", async (req, res) => {
    try {
      const jobs = await storage.getProcessingJobs();
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch processing jobs" });
    }
  });

  app.post("/api/processing-jobs", async (req, res) => {
    try {
      const job = insertProcessingJobSchema.parse(req.body);
      const newJob = await storage.createProcessingJob(job);
      res.json(newJob);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid job data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create processing job" });
      }
    }
  });

  app.patch("/api/processing-jobs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const updatedJob = await storage.updateProcessingJob(id, updates);
      if (!updatedJob) {
        return res.status(404).json({ error: "Processing job not found" });
      }
      res.json(updatedJob);
    } catch (error) {
      res.status(500).json({ error: "Failed to update processing job" });
    }
  });

  // Satellite data endpoints
  app.get("/api/satellite-data", async (req, res) => {
    try {
      const data = await storage.getSatelliteData();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch satellite data" });
    }
  });

  // Image upload and analysis endpoint
  app.post("/api/analyze-image", upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      // Store uploaded satellite data
      const satelliteData = await storage.createSatelliteData({
        dataSource: "Upload",
        imageUrl: `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
        processedData: {},
        qualityScore: 0.95,
        region: "User Upload"
      });

      // Simulate AI processing
      const mockDetections = [
        {
          name: `UC-${Date.now()}`,
          coordinates: `${(Math.random() * 30 + 5).toFixed(1)}°N, ${(Math.random() * 50 + 60).toFixed(1)}°E`,
          confidence: Math.random() * 0.3 + 0.7,
          precipitationProbability: Math.random() * 0.8 + 0.2,
          status: ["Active", "Forming", "High Risk"][Math.floor(Math.random() * 3)],
          movementSpeed: Math.random() * 20 + 5,
          area: Math.random() * 2000 + 1000,
          intensity: ["Low", "Moderate", "High"][Math.floor(Math.random() * 3)]
        }
      ];

      // Create detected clusters
      const detectedClusters = await Promise.all(
        mockDetections.map(detection => storage.createCloudCluster(detection))
      );

      res.json({
        satelliteData,
        detectedClusters,
        processingStats: {
          totalPixelsAnalyzed: req.file.size,
          processingTimeMs: Math.floor(Math.random() * 5000 + 2000),
          confidenceScore: Math.random() * 0.2 + 0.8
        }
      });
    } catch (error) {
      console.error("Image analysis error:", error);
      res.status(500).json({ error: "Failed to analyze image" });
    }
  });

  // MOSDAC data simulation endpoint
  app.post("/api/fetch-mosdac-data", async (req, res) => {
    try {
      // Simulate MOSDAC API call
      const mockSatelliteData = await storage.createSatelliteData({
        dataSource: "MOSDAC",
        imageUrl: "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&h=400",
        processedData: {
          temperature: -65,
          cloudTopHeight: 12000,
          precipitationRate: 15.2
        },
        qualityScore: 0.92,
        region: "Indian Ocean"
      });

      // Update system status
      await storage.updateSystemStatus("MOSDAC_API", {
        component: "MOSDAC_API",
        status: "Online",
        message: "Successfully fetched latest INSAT data"
      });

      res.json({
        success: true,
        data: mockSatelliteData,
        message: "MOSDAC data fetched successfully"
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch MOSDAC data" });
    }
  });

  // Dashboard metrics endpoint
  app.get("/api/dashboard-metrics", async (req, res) => {
    try {
      const clusters = await storage.getCloudClusters();
      const activeClusters = clusters.filter(c => c.status === "Active").length;
      const avgPrecipitation = clusters.reduce((sum, c) => sum + c.precipitationProbability, 0) / clusters.length;
      const dataPoints = await storage.getSatelliteData();
      
      const metrics = {
        activeClusters,
        precipitationProbability: avgPrecipitation,
        dataPoints: dataPoints.length * 1000, // Simulate large dataset
        modelAccuracy: 0.942,
        trackedStorms: Math.floor(activeClusters * 1.5),
        avgMovementSpeed: clusters.reduce((sum, c) => sum + (c.movementSpeed || 0), 0) / clusters.length,
        coverageArea: "2.4M km²",
        dataQuality: "Excellent"
      };

      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard metrics" });
    }
  });

  // AI Chat endpoint
  app.post("/api/ai-chat", async (req, res) => {
    try {
      const { message } = req.body;
      
      // Enhanced AI responses with location and ISTRAC context
      const locationResponses = [
        "Based on NAVIC satellite positioning and ISTRAC real-time data, your location shows moderate precipitation probability. Current atmospheric pressure suggests stable conditions for the next 4 hours.",
        "ISTRAC weather monitoring indicates a developing low-pressure system 150km northeast of your coordinates. U-Net segmentation models predict 73% chance of rainfall within 8 hours.",
        "GPS coordinates analysis shows you're in a region with historical cyclone activity. Our ConvLSTM tracking model suggests monitoring wind patterns from the southeast quadrant.",
        "Real-time INSAT data from ISTRAC indicates temperature gradients of 2.3°C/100km in your area. This thermal distribution pattern suggests potential convective development.",
        "NAVIC positioning confirms your location is within the monsoon convergence zone. Deep learning models (trained on CIFAR-10 atmospheric patterns) show 84% probability of precipitation onset.",
        "ISTRAC satellite telemetry indicates cloud top temperatures of -65°C at 12km altitude above your region. These conditions typically precede heavy precipitation events.",
        "Your GPS coordinates place you in the Bay of Bengal cyclogenesis monitoring zone. NLP analysis of regional weather reports shows increasing severe weather mentions.",
        "Real-time NAVIC data shows atmospheric moisture content at 85% relative humidity. Combined with ISTRAC wind shear measurements, this suggests storm formation potential.",
        "Location-based prediction models using ImageNet-enhanced pattern recognition show your area has 91% similarity to historical pre-monsoon atmospheric conditions.",
        "ISTRAC ground station data indicates ionospheric disturbances typical of approaching weather systems. Recommended monitoring frequency: every 30 minutes."
      ];
      
      const randomResponse = locationResponses[Math.floor(Math.random() * locationResponses.length)];
      
      res.json({
        response: randomResponse,
        timestamp: new Date().toISOString(),
        confidence: Math.random() * 0.3 + 0.7
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to process AI chat request" });
    }
  });

  // Model metrics endpoint
  app.get("/api/model-metrics", async (req, res) => {
    try {
      const metrics = {
        unet: {
          accuracy: 0.942,
          loss: 0.089,
          epochs: 45,
          trainingTime: "2h 34m",
          status: "completed"
        },
        convlstm: {
          accuracy: 0.887,
          loss: 0.156,
          epochs: 32,
          trainingTime: "3h 12m",
          status: "training"
        },
        cnn_classifier: {
          accuracy: 0.934,
          loss: 0.092,
          epochs: 67,
          trainingTime: "1h 45m",
          status: "completed"
        },
        nlp_sentiment: {
          accuracy: 0.889,
          loss: 0.134,
          epochs: 28,
          trainingTime: "1h 23m",
          status: "pending"
        }
      };
      
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch model metrics" });
    }
  });

  // Train model endpoint
  app.post("/api/train-model", async (req, res) => {
    try {
      const { modelType, dataset } = req.body;
      
      // Simulate training initiation
      await storage.createProcessingJob({
        jobType: "AI_PROCESSING",
        status: "Running",
        progress: 0,
        metadata: { modelType, dataset, stage: "initialization" }
      });
      
      res.json({
        success: true,
        message: `Started training ${modelType} on ${dataset}`,
        estimatedTime: "2-4 hours"
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to start model training" });
    }
  });

  // Stop training endpoint
  app.post("/api/stop-training", async (req, res) => {
    try {
      const { modelType } = req.body;
      
      res.json({
        success: true,
        message: `Stopped training for ${modelType}`,
        savedCheckpoint: true
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to stop model training" });
    }
  });

  // Location prediction endpoint
  app.post("/api/predict-location", async (req, res) => {
    try {
      const { latitude, longitude } = req.body;
      
      // Simulate location-based weather prediction
      const prediction = {
        latitude,
        longitude,
        location: `${latitude.toFixed(2)}°N, ${longitude.toFixed(2)}°E`,
        precipitationRisk: Math.random() * 0.8 + 0.1,
        cycloneRisk: Math.random() * 0.6 + 0.05,
        windSpeed: Math.floor(Math.random() * 25 + 5),
        temperature: Math.floor(Math.random() * 15 + 20),
        humidity: Math.floor(Math.random() * 30 + 60),
        timestamp: new Date().toISOString(),
        confidence: Math.random() * 0.3 + 0.7,
        source: ['GPS', 'NAVIC', 'ISTRAC'][Math.floor(Math.random() * 3)]
      };
      
      // Store prediction
      await storage.createSatelliteData({
        dataSource: "Location Prediction",
        imageUrl: null,
        processedData: prediction,
        qualityScore: prediction.confidence,
        region: `${latitude.toFixed(2)}°N, ${longitude.toFixed(2)}°E`
      });
      
      res.json({
        success: true,
        prediction,
        message: "Location-based prediction generated successfully"
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate location prediction" });
    }
  });

  // Location predictions endpoint
  app.get("/api/location-predictions", async (req, res) => {
    try {
      // Generate multiple sample predictions with realistic locations
      const indianLocations = [
        { lat: 12.9716, lng: 77.5946, name: "Bangalore" },
        { lat: 19.0760, lng: 72.8777, name: "Mumbai" },
        { lat: 28.7041, lng: 77.1025, name: "Delhi" },
        { lat: 13.0827, lng: 80.2707, name: "Chennai" },
        { lat: 22.5726, lng: 88.3639, name: "Kolkata" },
        { lat: 17.3850, lng: 78.4867, name: "Hyderabad" }
      ];
      
      const predictions = indianLocations.map(location => ({
        latitude: location.lat + (Math.random() - 0.5) * 0.5,
        longitude: location.lng + (Math.random() - 0.5) * 0.5,
        location: location.name,
        precipitationRisk: Math.random() * 0.9 + 0.1,
        cycloneRisk: Math.random() * 0.7 + 0.05,
        windSpeed: Math.floor(Math.random() * 30 + 5),
        temperature: Math.floor(Math.random() * 20 + 18),
        humidity: Math.floor(Math.random() * 40 + 50),
        timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        confidence: Math.random() * 0.3 + 0.7,
        source: ['GPS', 'NAVIC', 'ISTRAC'][Math.floor(Math.random() * 3)]
      }));
      
      res.json(predictions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch location predictions" });
    }
  });

  // ISTRAC real-time data endpoint
  app.get("/api/istrac-data", async (req, res) => {
    try {
      const now = new Date();
      const istTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
      
      const istracData = {
        timestamp: now.toISOString(),
        istTime: istTime.toISOString(),
        istTimeFormatted: istTime.toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }),
        satellites: [
          {
            name: "INSAT-3D",
            status: "Active",
            dataQuality: "Excellent",
            coverageArea: "Indian Subcontinent",
            lastUpdate: new Date().toISOString()
          },
          {
            name: "INSAT-3DR",
            status: "Active", 
            dataQuality: "Good",
            coverageArea: "Bay of Bengal",
            lastUpdate: new Date(Date.now() - 300000).toISOString()
          },
          {
            name: "NAVIC-1A",
            status: "Active",
            dataQuality: "Excellent",
            coverageArea: "Regional Navigation",
            lastUpdate: new Date().toISOString()
          }
        ],
        weatherParameters: {
          seaSurfaceTemperature: 28.5,
          atmosphericPressure: 1013.2,
          windShear: 12.3,
          moistureContent: 78,
          cloudTopHeight: 11500
        },
        alerts: [
          {
            type: "Cyclone Watch",
            region: "Bay of Bengal",
            severity: "Medium",
            timestamp: new Date().toISOString()
          }
        ]
      };
      
      res.json(istracData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch ISTRAC data" });
    }
  });

  // NASA Datasets endpoint
  app.get("/api/nasa-datasets", async (req, res) => {
    try {
      const nasaDatasets = [
        {
          name: "MODIS Atmosphere",
          description: "Moderate Resolution Imaging Spectroradiometer atmospheric data for cloud analysis",
          size: "15.2 GB",
          format: "NetCDF",
          lastUpdated: "2 hours ago",
          status: "complete"
        },
        {
          name: "GOES-16 Weather",
          description: "Geostationary weather satellite data for real-time meteorological analysis",
          size: "8.7 GB", 
          format: "HDF5",
          lastUpdated: "30 minutes ago",
          status: "downloading",
          downloadProgress: 73
        },
        {
          name: "GPM Precipitation",
          description: "Global Precipitation Measurement mission data for rainfall prediction",
          size: "12.4 GB",
          format: "NetCDF",
          lastUpdated: "1 hour ago",
          status: "processing"
        },
        {
          name: "ECMWF Reanalysis",
          description: "European Centre atmospheric reanalysis data for weather pattern recognition",
          size: "22.1 GB",
          format: "GRIB",
          lastUpdated: "45 minutes ago",
          status: "available"
        },
        {
          name: "SMAP Soil Moisture",
          description: "Soil Moisture Active Passive satellite data for land-atmosphere interactions",
          size: "6.8 GB",
          format: "HDF5",
          lastUpdated: "3 hours ago",
          status: "complete"
        },
        {
          name: "CloudSat Radar",
          description: "Cloud profiling radar data for 3D cloud structure analysis",
          size: "18.9 GB",
          format: "HDF4",
          lastUpdated: "1.5 hours ago",
          status: "available"
        }
      ];
      
      res.json(nasaDatasets);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch NASA datasets" });
    }
  });

  // Download NASA dataset endpoint
  app.post("/api/download-nasa-dataset", async (req, res) => {
    try {
      const { dataset } = req.body;
      
      // Simulate dataset download initiation
      await storage.createProcessingJob({
        jobType: "DATA_INGESTION",
        status: "Running",
        progress: 0,
        metadata: { dataset, source: "NASA", stage: "download" }
      });
      
      res.json({
        success: true,
        message: `Started downloading NASA dataset: ${dataset}`,
        estimatedTime: "15-30 minutes"
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to start NASA dataset download" });
    }
  });

  // Train with NASA data endpoint
  app.post("/api/train-with-nasa", async (req, res) => {
    try {
      const { datasets } = req.body;
      
      // Create training jobs for each dataset
      for (const dataset of datasets) {
        await storage.createProcessingJob({
          jobType: "AI_PROCESSING",
          status: "Running",
          progress: 0,
          metadata: { 
            modelType: "enhanced_prediction",
            dataset,
            source: "NASA",
            stage: "training"
          }
        });
      }
      
      res.json({
        success: true,
        message: `Started training with ${datasets.length} NASA datasets`,
        datasets,
        estimatedTime: "2-6 hours"
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to start NASA training" });
    }
  });

  // Security status endpoint
  app.get("/api/security-status", async (req, res) => {
    try {
      const securityStatus = {
        timestamp: new Date().toISOString(),
        cloudflare: {
          status: "active",
          cacheHitRatio: 98.7,
          bandwidthSaved: "2.4 GB",
          threatsBlocked: 847
        },
        ssl: {
          encryption: "TLS 1.3",
          certificate: "valid",
          hsts: true
        },
        metrics: {
          uptime: 99.9,
          avgResponseTime: 2.1,
          vulnerabilities: 0
        },
        protections: [
          { name: "DDoS Protection", status: "secure" },
          { name: "Bot Management", status: "secure" },
          { name: "WAF Rules", status: "secure" },
          { name: "Rate Limiting", status: "secure" },
          { name: "Geo Blocking", status: "secure" },
          { name: "API Security", status: "secure" }
        ]
      };
      
      res.json(securityStatus);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch security status" });
    }
  });

  // INSAT satellite data endpoint
  app.get("/api/insat-data", async (req, res) => {
    try {
      const insatData = {
        timestamp: new Date().toISOString(),
        satellite: "INSAT-3D",
        observation_time: new Date().toISOString(),
        channels: {
          ir1: 220.5 + (Math.random() - 0.5) * 20, // 10.8μm infrared
          ir2: 225.3 + (Math.random() - 0.5) * 18, // 12.0μm infrared  
          wv: 240.8 + (Math.random() - 0.5) * 25,  // 6.7μm water vapor
          vis: 0.65 + (Math.random() - 0.5) * 0.3  // 0.65μm visible
        },
        geolocation: {
          latitude_range: [8.0, 37.0],
          longitude_range: [68.0, 97.0],
          resolution: "1km"
        },
        quality_flags: {
          calibration_status: "nominal",
          data_quality: "excellent",
          cloud_mask_quality: 0.95
        }
      };
      
      res.json(insatData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch INSAT data" });
    }
  });

  // Cloud analysis endpoint
  app.get("/api/cloud-analysis", async (req, res) => {
    try {
      const analysisResults = [
        {
          id: "analysis_" + Date.now(),
          timestamp: new Date().toISOString(),
          brightness_temperature: {
            ir1: 215.3,
            ir2: 220.8,
            wv: 235.2,
            vis: 0.8
          },
          segmentation_results: {
            confidence: 0.932,
            cluster_count: 7,
            total_area: 15420.5,
            density_map: Array(32).fill(0).map(() => 
              Array(32).fill(0).map(() => Math.random())
            )
          },
          tracking_data: {
            movement_vector: { x: 12.5, y: -8.3 },
            speed: 15.2,
            direction: 145,
            persistence: 0.84
          },
          reanalysis_validation: {
            era5_correlation: 0.89,
            ncep_agreement: 0.82,
            validation_score: 0.855
          }
        }
      ];
      
      res.json(analysisResults);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cloud analysis results" });
    }
  });

  // Start cloud analysis endpoint
  app.post("/api/start-cloud-analysis", async (req, res) => {
    try {
      const { channels, algorithm } = req.body;
      
      // Create processing job for cloud analysis
      await storage.createProcessingJob({
        jobType: "AI_PROCESSING",
        status: "Running",
        progress: 0,
        metadata: { 
          algorithm,
          channels,
          analysisType: "tropical_cloud_clusters",
          stage: "initialization"
        }
      });
      
      res.json({
        success: true,
        message: `Started ${algorithm} analysis with channels: ${channels.join(', ')}`,
        estimatedTime: "5-15 minutes",
        analysisId: "analysis_" + Date.now()
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to start cloud analysis" });
    }
  });

  // Paper templates endpoint
  app.get("/api/paper-templates", async (req, res) => {
    try {
      const templates = [
        {
          id: "ieee_transactions",
          title: "IEEE Transactions on Geoscience and Remote Sensing",
          template: "ieee",
          journal: "IEEE Trans. Geosci. Remote Sens.",
          citation_style: "IEEE",
          sections: ["Abstract", "Introduction", "Methodology", "Results and Analysis", "Discussion", "Conclusion", "References"]
        },
        {
          id: "journal_climate",
          title: "Journal of Climate - AMS",
          template: "ams",
          journal: "Journal of Climate",
          citation_style: "AMS",
          sections: ["Abstract", "Introduction", "Data and Methods", "Results", "Discussion and Conclusions", "Acknowledgments", "References"]
        },
        {
          id: "remote_sensing",
          title: "Remote Sensing (MDPI)",
          template: "mdpi",
          journal: "Remote Sensing",
          citation_style: "MDPI",
          sections: ["Abstract", "Introduction", "Materials and Methods", "Results", "Discussion", "Conclusions", "References"]
        },
        {
          id: "atmospheric_research",
          title: "Atmospheric Research - Elsevier",
          template: "elsevier",
          journal: "Atmospheric Research",
          citation_style: "Elsevier",
          sections: ["Abstract", "Introduction", "Methodology", "Results and Discussion", "Conclusions", "Acknowledgments", "References"]
        }
      ];
      
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch paper templates" });
    }
  });

  // Generated papers endpoint
  app.get("/api/generated-papers", async (req, res) => {
    try {
      const papers = [
        {
          id: "paper_" + Date.now(),
          title: "Automated Identification of Tropical Cloud Clusters Using Deep Learning-Based Analysis of INSAT Satellite Data",
          abstract: "This study presents a novel artificial intelligence and machine learning approach for automated identification of tropical cloud clusters using half-hourly INSAT satellite data. We developed a comprehensive framework incorporating multi-channel brightness temperature analysis, U-Net deep learning segmentation, and LSTM-based temporal tracking. The methodology demonstrates exceptional performance with segmentation confidence exceeding 93% and strong correlation with ERA5 reanalysis datasets (r = 0.89). Our approach successfully identified and tracked 847 cloud cluster events over a six-month period, providing valuable insights into tropical convective processes and their temporal evolution.",
          authors: ["Dr. ISRO Research Team", "ISTRAC Analysis Division", "MOSDAC Data Processing Unit"],
          keywords: ["tropical cloud clusters", "INSAT satellite", "machine learning", "U-Net segmentation", "temporal tracking", "brightness temperature", "ERA5 validation"],
          sections: {
            introduction: "Tropical cloud clusters play a crucial role in regional and global weather patterns...",
            methodology: "Our approach combines multi-channel satellite data analysis with advanced deep learning techniques...",
            results: "The U-Net segmentation model achieved a Dice coefficient of 0.932 and IoU score of 0.887...",
            discussion: "The temporal tracking results reveal significant patterns in cloud cluster evolution...",
            conclusion: "This automated framework provides a robust tool for operational meteorological analysis...",
            references: [
              "Ronneberger, O., Fischer, P., & Brox, T. (2015). U-Net: Convolutional Networks for Biomedical Image Segmentation.",
              "Hersbach, H., et al. (2020). The ERA5 global reanalysis. Quarterly Journal of the Royal Meteorological Society.",
              "LeCun, Y., Bengio, Y., & Hinton, G. (2015). Deep learning. Nature, 521(7553), 436-444."
            ]
          },
          figures: [
            { id: "fig1", caption: "Multi-channel brightness temperature analysis showing IR1, IR2, WV, and VIS channels", data_source: "INSAT-3D" },
            { id: "fig2", caption: "U-Net segmentation results with confidence mapping", data_source: "AI Analysis" },
            { id: "fig3", caption: "Temporal tracking vectors and movement patterns", data_source: "LSTM Model" }
          ],
          tables: [
            { id: "table1", caption: "Model performance metrics and validation scores", data: [] },
            { id: "table2", caption: "Comparison with ERA5 and NCEP reanalysis datasets", data: [] }
          ],
          status: "complete",
          generated_at: new Date().toISOString(),
          word_count: 4750
        }
      ];
      
      res.json(papers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch generated papers" });
    }
  });

  // Generate paper endpoint
  app.post("/api/generate-paper", async (req, res) => {
    try {
      const { template_id, title, authors, keywords, analysis_data } = req.body;
      
      // Create processing job for paper generation
      await storage.createProcessingJob({
        jobType: "AI_PROCESSING",
        status: "Running",
        progress: 0,
        metadata: { 
          type: "paper_generation",
          template_id,
          title,
          authors,
          keywords,
          stage: "content_generation"
        }
      });
      
      const paperId = "paper_" + Date.now();
      
      res.json({
        success: true,
        paperId,
        title,
        message: "Scientific paper generation started",
        estimatedTime: "10-20 minutes"
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to start paper generation" });
    }
  });

  // Download paper endpoint
  app.post("/api/download-paper", async (req, res) => {
    try {
      const { paperId, format } = req.body;
      
      // Simulate paper download preparation
      res.json({
        success: true,
        downloadUrl: `/downloads/${paperId}.${format}`,
        format,
        message: `Paper prepared for download in ${format.toUpperCase()} format`
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to prepare paper download" });
    }
  });

  // Admin authentication endpoint
  app.post("/api/admin/authenticate", async (req, res) => {
    try {
      const { password } = req.body;
      const adminPassword = "$4#3@2!1"; // Admin password
      
      if (password === adminPassword) {
        res.json({
          success: true,
          message: "Admin access granted",
          role: "administrator"
        });
      } else {
        res.status(401).json({
          success: false,
          message: "Invalid credentials"
        });
      }
    } catch (error) {
      res.status(500).json({ error: "Authentication failed" });
    }
  });

  // Admin training jobs endpoint
  app.get("/api/admin/training-jobs", async (req, res) => {
    try {
      const trainingJobs = [
        {
          id: "job_" + Date.now(),
          model_name: "U-Net",
          dataset: "INSAT-3D",
          status: "running",
          progress: 67.3,
          epochs_completed: 34,
          total_epochs: 50,
          loss: 0.0324,
          accuracy: 0.924,
          started_at: new Date(Date.now() - 3600000).toISOString(),
          estimated_completion: "45 minutes"
        },
        {
          id: "job_" + (Date.now() - 1000),
          model_name: "ConvLSTM",
          dataset: "MODIS",
          status: "completed",
          progress: 100,
          epochs_completed: 75,
          total_epochs: 75,
          loss: 0.0189,
          accuracy: 0.942,
          started_at: new Date(Date.now() - 7200000).toISOString(),
          estimated_completion: "completed"
        }
      ];
      
      res.json(trainingJobs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch training jobs" });
    }
  });

  // Admin system metrics endpoint
  app.get("/api/admin/system-metrics", async (req, res) => {
    try {
      const metrics = {
        cpu_usage: Math.floor(Math.random() * 30 + 45),
        memory_usage: Math.floor(Math.random() * 20 + 60),
        gpu_usage: Math.floor(Math.random() * 40 + 70),
        disk_usage: Math.floor(Math.random() * 15 + 25),
        network_io: "2.3 GB/s",
        active_models: 4,
        concurrent_users: 3
      };
      
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch system metrics" });
    }
  });

  // Start training endpoint
  app.post("/api/admin/start-training", async (req, res) => {
    try {
      const { model_name, dataset, epochs, learning_rate } = req.body;
      
      // Create training job
      await storage.createProcessingJob({
        jobType: "AI_PROCESSING",
        status: "Running",
        progress: 0,
        metadata: { 
          type: "model_training",
          model_name,
          dataset,
          epochs,
          learning_rate,
          stage: "initialization"
        }
      });
      
      const jobId = "job_" + Date.now();
      
      res.json({
        success: true,
        jobId,
        model_name,
        dataset,
        message: `Training started for ${model_name} on ${dataset}`,
        estimatedTime: `${Math.ceil(epochs * 2)} minutes`
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to start training" });
    }
  });

  // Stop training endpoint
  app.post("/api/admin/stop-training", async (req, res) => {
    try {
      const { jobId } = req.body;
      
      res.json({
        success: true,
        jobId,
        message: "Training job stopped successfully"
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to stop training" });
    }
  });

  // Datasets endpoint
  app.get("/api/datasets", async (req, res) => {
    try {
      const datasets = [
        {
          name: 'MNIST',
          type: 'vision',
          samples: 70000,
          classes: 10,
          description: 'Handwritten digits classification'
        },
        {
          name: 'CIFAR-10',
          type: 'vision',
          samples: 60000,
          classes: 10,
          description: 'Object recognition in 32x32 images'
        },
        {
          name: 'ImageNet',
          type: 'vision',
          samples: 1281167,
          classes: 1000,
          description: 'Large-scale object recognition'
        },
        {
          name: 'IMDB Reviews',
          type: 'nlp',
          samples: 50000,
          classes: 2,
          description: 'Movie review sentiment analysis'
        },
        {
          name: 'Yelp Dataset',
          type: 'nlp',
          samples: 8635403,
          classes: 5,
          description: 'Business review sentiment classification'
        }
      ];
      
      res.json(datasets);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch datasets" });
    }
  });

  // Export data endpoint
  app.get("/api/export-data", async (req, res) => {
    try {
      const format = req.query.format || 'json';
      const clusters = await storage.getCloudClusters();
      const satelliteData = await storage.getSatelliteData();
      
      const exportData = {
        exportedAt: new Date().toISOString(),
        cloudClusters: clusters,
        satelliteData: satelliteData,
        summary: {
          totalClusters: clusters.length,
          activeClusters: clusters.filter(c => c.status === "Active").length,
          avgConfidence: clusters.reduce((sum, c) => sum + c.confidence, 0) / clusters.length
        }
      };

      if (format === 'csv') {
        // Generate CSV format
        const csv = [
          'Name,Coordinates,Confidence,Precipitation Probability,Status,Movement Speed,Area,Intensity,Detected At',
          ...clusters.map(c => 
            `${c.name},"${c.coordinates}",${c.confidence},${c.precipitationProbability},${c.status},${c.movementSpeed || ''},${c.area || ''},${c.intensity || ''},${c.detectedAt?.toISOString() || ''}`
          )
        ].join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=mipid-export.csv');
        res.send(csv);
      } else {
        res.json(exportData);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to export data" });
    }
  });

  // Route to trigger a social media post about an upcoming launch
  app.post("/api/social/post-launch-update", async (req, res) => {
    // In a real application, this endpoint should be protected (e.g., admin only, or called by a secure scheduler)
    try {
      const result = await postUpcomingLaunchUpdate();
      if (result.success) {
        res.json({ success: true, message: result.message, details: result });
      } else {
        // Determine appropriate status code based on failure type if possible
        // For now, using 500 for general failure, 404 if no launch found, etc.
        let statusCode = 500;
        if (result.message.includes("No suitable upcoming launches") || result.message.includes("No new upcoming launches")) {
          statusCode = 404;
        } else if (result.message.includes("Twitter client not initialized")) {
          statusCode = 503; // Service Unavailable
        }
        res.status(statusCode).json({ success: false, message: result.message, details: result });
      }
    } catch (error: any) {
      console.error("Error in /api/social/post-launch-update endpoint:", error);
      res.status(500).json({ success: false, message: "Internal server error while trying to post social update.", error: error.message });
    }
  });

  // Community Reports Endpoints
  app.get("/api/community-reports", async (req, res) => {
    try {
      const reports = await storage.getCommunityReports();
      res.json(reports);
    } catch (error) {
      console.error("Error fetching community reports:", error);
      res.status(500).json({ error: "Failed to fetch community reports" });
    }
  });

  app.post("/api/community-reports", async (req, res) => {
    try {
      const reportData = insertCommunityReportSchema.parse(req.body);
      // Convert sightingTime to Date object if it's a string, Zod might not do this automatically for custom parsing
      // However, our MemStorage createCommunityReport already handles new Date(report.sightingTime)
      const newReport = await storage.createCommunityReport(reportData);
      res.status(201).json(newReport);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid report data", details: error.errors });
      } else {
        console.error("Error creating community report:", error);
        res.status(500).json({ error: "Failed to create community report" });
      }
    }
  });

  // Push Notification Endpoints
  app.post("/api/push/subscribe", async (req, res) => {
    try {
      const subscription = req.body as StoredPushSubscription; // Assume client sends a valid StoredPushSubscription structure
      // Basic validation (more robust validation might be needed in a real app)
      if (!subscription || !subscription.endpoint || !subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
        return res.status(400).json({ error: "Invalid push subscription object received." });
      }
      await storage.savePushSubscription(subscription);
      res.status(201).json({ message: "Subscription saved." });
    } catch (error: any) {
      console.error("Error saving push subscription:", error);
      res.status(500).json({ error: "Failed to save push subscription.", details: error.message });
    }
  });

  app.post("/api/push/unsubscribe", async (req, res) => {
    try {
      const { endpoint } = req.body; // Client should send its endpoint to unsubscribe
      if (!endpoint) {
        return res.status(400).json({ error: "Endpoint is required to unsubscribe." });
      }
      await storage.removePushSubscription(endpoint);
      res.status(200).json({ message: "Subscription removed." });
    } catch (error: any) {
      console.error("Error removing push subscription:", error);
      res.status(500).json({ error: "Failed to remove push subscription.", details: error.message });
    }
  });

  app.post("/api/push/send-test-notification", async (req, res) => {
    // This should be protected in a real app (e.g., admin only)
    try {
      const payload: PushNotificationPayload = {
        title: "Test Notification from ISRO App",
        body: "Hello! This is a test push notification.",
        icon: "/client/src/assets/isro-logo.svg", // Ensure this path is accessible from web root
        url: "/", // URL to open on click
      };
      const result = await sendPushNotificationToAll(payload);
      if (result.success || (result.results && result.results.length > 0)) { // Success if at least one attempted/sent
        res.json({ success: true, message: result.message, details: result.results });
      } else {
        res.status(500).json({ success: false, message: result.message || "Failed to send any notifications." });
      }
    } catch (error: any) {
      console.error("Error sending test notification:", error);
      res.status(500).json({ error: "Failed to send test notification.", details: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
