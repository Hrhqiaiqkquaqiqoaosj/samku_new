const express = require("express");
require("./config/solar.mqtt");
require("./config/protocol.manager");   // 👈 ADD THIS
require("./services/mqtt.charger");
require("./services/solar.listener")
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");
const WebSocket = require("ws");
const { v4: uuidv4 } = require("uuid");
const http = require("http");
const Transaction = require("./models/Transaction");
const User = require("./models/User");

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const stationRoutes = require("./routes/stations");
const chargerRoutes = require("./routes/chargers");
const transactionRoutes = require("./routes/transactions");
const customerRoutes = require("./routes/customers");
const rfidRoutes = require("./routes/rfid");
const walletRoutes = require("./routes/wallet");
const hostRoutes = require("./routes/hosts");
const ocppRoutes = require("./routes/ocpp");
const solarStationRoutes =
require("./routes/solarStation.routes");

class SamkuCMSServer {
  constructor() {
    this.app = express();
    this.server = null;
    this.wss = null;
    this.chargePoints = new Map(); // Store connected charge points
    this.uiClients = new Map(); // Store UI clients
    this.logs = []; // Store all logs
    this.maxLogs = 10000; // Maximum logs to keep in memory
    this.port = process.env.PORT || 5000;
    this.isDevelopment = process.env.NODE_ENV !== "production";
    this.heartbeatInterval = null; // Store heartbeat interval reference

    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
    this.connectDatabase();
  }

  initializeMiddleware() {
    // Security middleware
    this.app.use(
      helmet({
        crossOriginEmbedderPolicy: false,
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https:"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "ws:", "wss:", "https:"],
          },
        },
      })
    );
   this.app.use((req, res, next) => {
     res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
     res.setHeader("Pragma", "no-cache");
     res.setHeader("Expires", "0");
     next();
   });

    // CORS configuration
   const corsOptions = {
     origin: this.isDevelopment
       ? [
           "http://localhost:5173",
           "http://localhost:3000",
           "http://10.48.115.31:5173",
           "https://samku-cms.vercel.app",
           "https://cms-o4rp.onrender.com"
         ]
        : [
   "https://cms-o4rp.onrender.com",
   "https://samku-new-4i2u.vercel.app"
 ],
      credentials: true,
      optionsSuccessStatus: 200,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
      preflightContinue: false,
      optionsSuccessStatus: 204,
    };
    this.app.use(cors(corsOptions));

    // Additional middleware to ensure CORS headers are set properly
    this.app.use((req, res, next) => {
      const origin = req.headers.origin;
      if (this.isDevelopment) {
       if ([
         'http://localhost:5173',
         'http://localhost:3000',
         'http://10.48.115.31:5173',
         'https://samku-cms.vercel.app'
       ].includes(origin)) {
          res.setHeader('Access-Control-Allow-Origin', origin);
        }
     } else if (
   origin === 'https://cms-o4rp.onrender.com' ||
   origin === 'https://samku-new-4i2u.vercel.app'
) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      }
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      if (req.method === 'OPTIONS') {
        return res.status(204).end();
      }
      next();
    });

    // Rate limiting
    const limiter = rateLimit({
      windowMs: this.isDevelopment
        ? 1 * 60 * 1000 // 1 minute in development
        : parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes in production
      max: this.isDevelopment
        ? 1000 // 1000 requests per minute in development
        : parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requests per 15 minutes in production
      message: {
        error: "Too many requests from this IP, please try again later.",
      },
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req, res) => {
        // Skip rate limiting for development environment
        return (
          (this.isDevelopment && req.ip === "::1") ||
          req.ip === "127.0.0.1" ||
          req.ip === "::ffff:127.0.0.1"
        );
      },
    });
    this.app.use("/api/", limiter);

    // Compression
    this.app.use(compression());

    // Logging
    if (this.isDevelopment) {
      this.app.use(morgan("dev"));
    } else {
      this.app.use(morgan("combined"));
    }

    // Body parsing middleware
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));

    // Trust proxy (important for rate limiting and IP detection)
    this.app.set("trust proxy", 1);
  }

  initializeRoutes() {
    // Health check endpoint
    this.app.get("/health", (req, res) => {
      res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        version: "1.0.0",
        uptime: process.uptime(),
        ocppServer: {
          connectedChargePoints: this.chargePoints.size,
          totalLogs: this.logs.length
        }
      });
    });

    // OCPP WebSocket status endpoint
    this.app.get("/api/ocpp/server-status", (req, res) => {
      res.json({
        success: true,
        data: {
          status: 'running',
          connectedChargePoints: this.chargePoints.size,
          totalMessages: this.logs.length,
          uptime: process.uptime(),
          serverTime: new Date().toISOString(),
          version: '1.6',
          port: this.port,
          chargePoints: Array.from(this.chargePoints.entries()).map(([id, cp]) => ({
            id,
            status: cp.status,
            lastSeen: cp.lastSeen,
            connectedAt: cp.connectedAt,
            messageCount: cp.messageCount,
            ip: cp.ip
          }))
        }
      });
    });

    // OCPP logs endpoint
    this.app.get("/api/ocpp/logs", (req, res) => {
      const { limit = 100, chargePointId, direction, action } = req.query;

      let filteredLogs = this.logs;

      // Apply filters
      if (chargePointId) {
        filteredLogs = filteredLogs.filter(log => log.chargePointId === chargePointId);
      }
      if (direction) {
        filteredLogs = filteredLogs.filter(log => log.direction === direction);
      }
      if (action) {
        filteredLogs = filteredLogs.filter(log => log.action === action);
      }

      const result = filteredLogs
        .slice(-parseInt(limit))
        .reverse(); // Show newest first

      res.json({
        success: true,
        data: {
          logs: result,
          total: filteredLogs.length,
          filtered: filteredLogs.length < this.logs.length
        }
      });
    });

    // Connected chargers endpoint
    this.app.get("/api/ocpp/connected-chargers", (req, res) => {
      const chargePointsList = Array.from(this.chargePoints.entries()).map(([id, cp]) => ({
        id,
        status: cp.status,
        lastSeen: cp.lastSeen,
        connectedAt: cp.connectedAt,
        messageCount: cp.messageCount,
        ip: cp.ip
      }));

      res.json({
        success: true,
        data: {
          connectedChargers: chargePointsList,
          totalConnected: chargePointsList.length,
          lastUpdated: new Date().toISOString()
        }
      });
    });

    // Send command to charge point
    this.app.post("/api/ocpp/send-command", (req, res) => {
      const { chargePointId, command, payload = {} } = req.body;

      if (!chargePointId || !command) {
        return res.status(400).json({
          success: false,
          message: 'chargePointId and command are required'
        });
      }

      const success = this.sendCommandToChargePoint(chargePointId, command, payload);

      if (success) {
        res.json({
          success: true,
          data: {
            messageId: uuidv4(),
            chargePointId,
            command,
            payload,
            sentAt: new Date().toISOString(),
            status: 'sent'
          }
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Charge point not connected or not found'
        });
      }
    });

    // API routes
    this.app.use("/api/auth", authRoutes);
    this.app.use("/api/solar", require("./routes/solar.routes"));
    this.app.use("/api/battery", require("./routes/battery.routes"));
    this.app.use("/api/grid", require("./routes/grid.routes"));
    this.app.use("/api/ems", require("./routes/ems.routes"));
    this.app.use("/api/users", userRoutes);
    this.app.use("/api/stations", stationRoutes);
    this.app.use("/api/chargers", chargerRoutes);
    this.app.use("/api/transactions", transactionRoutes);
    this.app.use("/api/customers", customerRoutes);
    this.app.use("/api/rfid", rfidRoutes);
    this.app.use("/api/wallet", walletRoutes);
    this.app.use("/api/hosts", hostRoutes);
    this.app.use("/api/ocpp", ocppRoutes);
    this.app.use("/api/stats", require("./routes/stats"));
    this.app.use(
       "/api/solar-station",
       solarStationRoutes
    );

    // Default route
    this.app.get("/", (req, res) => {
      res.json({
        message: "Samku CMS Backend API with OCPP WebSocket Server",
        version: "1.0.0",
        documentation: "/api/docs",
        health: "/health",
        ocppWebSocket: this.isDevelopment
          ? `ws://localhost:${this.port}/ocpp/{charger-id}`
          : `wss://cms-o4rp.onrender.com/ocpp/{charger-id}`,
        connectedChargePoints: this.chargePoints.size
      });
    });

    // 404 handler
    this.app.use("*", (req, res) => {
      res.status(404).json({
        success: false,
        message: "Route not found",
      });
    });
  }

  initializeErrorHandling() {
    // Global error handler
    this.app.use((error, req, res, next) => {
      console.error("Global error handler:", error);

      // MongoDB validation error
      if (error.name === "ValidationError") {
        const errors = Object.values(error.errors).map((err) => err.message);
        return res.status(400).json({
          success: false,
          message: "Validation Error",
          errors,
        });
      }

      // MongoDB duplicate key error
      if (error.code === 11000) {
        const field = Object.keys(error.keyValue)[0];
        return res.status(400).json({
          success: false,
          message: `${field} already exists`,
        });
      }

      // JWT errors
      if (error.name === "JsonWebTokenError") {
        return res.status(401).json({
          success: false,
          message: "Invalid token",
        });
      }

      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Token expired",
        });
      }

      // Default error
      res.status(error.status || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
        ...(this.isDevelopment && { stack: error.stack }),
      });
    });
  }

  async connectDatabase() {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log("🗄️  Connected to MongoDB Atlas");
    } catch (error) {
      console.error("❌ MongoDB connection error:", error);
      process.exit(1);
    }
  }

  initializeOCPPWebSocket() {
    // Create HTTP server
    this.server = http.createServer(this.app);

    // Initialize WebSocket server
    this.wss = new WebSocket.Server({
      server: this.server,
      handleProtocols: (protocols, request) => {
        const supportedProtocols = ["ocpp1.6", "ocpp2.0.1"];

        for (const protocol of protocols) {
          if (supportedProtocols.includes(protocol)) {
            console.log(`✅ Selected OCPP protocol: ${protocol}`);
            return protocol;
          }
        }

        console.log("❌ Unsupported OCPP version requested:", protocols);
        return false; // Reject connection
      }
    });

    this.wss.on('connection', (ws, req) => {
      try {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const pathParts = url.pathname.split('/');
        const chargePointId = pathParts[pathParts.length - 1];

        if (!chargePointId || chargePointId === 'ocpp') {
          ws.close(1008, 'Charge Point ID required');
          return;
        }

        // Add isAlive property to track connection health
        ws.isAlive = true;

        // Set up ping response handler
        ws.on('pong', () => {
          ws.isAlive = true;
        });

        // Check if this is a UI client connection
        if (chargePointId === 'ui-client') {
          this.handleUIClient(ws, req);
          return;
        }

        this.handleChargePointConnection(ws, chargePointId, req);
      } catch (error) {
        console.error('Error handling WebSocket connection:', error);
        ws.close(1011, 'Server error');
      }
    });

    // Start heartbeat interval to keep connections alive
    this.startHeartbeat();

    console.log('🔌 OCPP WebSocket Server initialized');
  }

  // New method to handle WebSocket heartbeat
  startHeartbeat() {
    // Clear any existing interval
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Set up heartbeat interval (every 45 seconds to avoid conflicts with client pings)
    this.heartbeatInterval = setInterval(() => {
      let uiClientCount = 0;
      let chargePointCount = 0;

      // Check UI clients with more lenient timing
      this.uiClients.forEach((client, id) => {
        if (client.ws.readyState !== WebSocket.OPEN) {
          console.log(`UI client ${id} connection not open, removing from clients`);
          this.uiClients.delete(id);
          return;
        }

        // For UI clients, check if they haven't sent any message in the last 90 seconds
        const lastActivity = new Date(client.lastPing).getTime();
        const now = Date.now();
        const timeSinceLastActivity = now - lastActivity;

        if (timeSinceLastActivity > 90000) { // 90 seconds
          console.log(`UI client ${id} inactive for ${Math.round(timeSinceLastActivity/1000)}s, terminating connection`);
          client.ws.terminate();
          this.uiClients.delete(id);
          return;
        }

        // Only ping if client hasn't been active recently
        if (timeSinceLastActivity > 45000) { // 45 seconds
          try {
            client.ws.ping();
            console.log(`Heartbeat ping sent to UI client ${id}`);
          } catch (error) {
            console.error(`Error sending ping to UI client ${id}:`, error);
            this.uiClients.delete(id);
            return;
          }
        }

        uiClientCount++;
      });

      // Check charge points (keep existing logic but with better error handling)
      this.chargePoints.forEach((cp, id) => {
        if (cp.ws.readyState !== WebSocket.OPEN) {
          console.log(`Charge point ${id} connection not open, marking as disconnected`);
          cp.status = 'Disconnected';
          return;
        }

        if (cp.ws.isAlive === false) {
          console.log(`Charge point ${id} not responding to heartbeat, terminating connection`);
          try {
            cp.ws.terminate();
          } catch (error) {
            console.error(`Error terminating charge point ${id}:`, error);
          }
          cp.status = 'Disconnected';
          return;
        }

        cp.ws.isAlive = false;
        try {
          cp.ws.ping();
        } catch (error) {
          console.error(`Error sending ping to charge point ${id}:`, error);
          cp.status = 'Disconnected';
          return;
        }
        chargePointCount++;
      });

      if (uiClientCount > 0 || chargePointCount > 0) {
        console.log(`Heartbeat check: ${uiClientCount} UI clients, ${chargePointCount} charge points active`);
      }
    }, 45000); // 45 seconds interval to avoid conflicts with client 30s pings
  }

  handleUIClient(ws, req) {
    const clientId = uuidv4();

    // Extract and validate authentication token from query parameters or headers
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token') || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      console.log(`UI client connection rejected: No authentication token provided`);
      ws.close(1008, 'Authentication required');
      return;
    }

    // Verify JWT token (basic validation)
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log(`UI client authenticated for user: ${decoded.id}`);
    } catch (error) {
      console.log(`UI client connection rejected: Invalid token - ${error.message}`);
      ws.close(1008, 'Invalid authentication token');
      return;
    }

    const clientInfo = {
      ws,
      connectedAt: new Date().toISOString(),
      lastPing: new Date().toISOString(),
      ip: req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
      authenticated: true,
      token: token
    };

    // Ensure ws has isAlive property and set to true initially
    ws.isAlive = true;

    this.uiClients.set(clientId, clientInfo);

    // Handle incoming messages from UI client
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());

        // Update last activity timestamp
        if (this.uiClients.has(clientId)) {
          this.uiClients.get(clientId).lastPing = new Date().toISOString();
        }

        this.handleUIMessage(clientId, message);
      } catch (error) {
        console.error(`Error parsing UI message from ${clientId}:`, error);
        this.sendToUIClient(clientId, {
          type: 'error',
          message: 'Invalid JSON format',
          timestamp: new Date().toISOString()
        });
      }
    });

    // Handle WebSocket close with detailed logging
    ws.on('close', (code, reason) => {
      const reasonStr = reason ? reason.toString() : 'No reason provided';
      console.log(`UI client ${clientId} disconnected: Code ${code}, Reason: ${reasonStr}`);

      // Log additional context for debugging
      if (this.uiClients.has(clientId)) {
        const client = this.uiClients.get(clientId);
        const connectionDuration = Date.now() - new Date(client.connectedAt).getTime();
        console.log(`UI client ${clientId} connection details: Duration ${Math.round(connectionDuration/1000)}s, Last ping: ${client.lastPing}`);
      }

      this.uiClients.delete(clientId);

      // Log common close codes for debugging
      switch (code) {
        case 1000:
          console.log(`UI client ${clientId}: Normal closure`);
          break;
        case 1001:
          console.log(`UI client ${clientId}: Going away (page refresh/navigation)`);
          break;
        case 1006:
          console.log(`UI client ${clientId}: Abnormal closure (network issue)`);
          break;
        case 1008:
          console.log(`UI client ${clientId}: Policy violation`);
          break;
        case 1011:
          console.log(`UI client ${clientId}: Server error`);
          break;
        default:
          console.log(`UI client ${clientId}: Unusual close code ${code}`);
      }
    });

    // Handle WebSocket errors with detailed logging
    ws.on('error', (error) => {
      console.error(`UI client ${clientId} WebSocket error:`, {
        message: error.message,
        code: error.code,
        errno: error.errno,
        syscall: error.syscall
      });

      // Clean up client on error
      if (this.uiClients.has(clientId)) {
        this.uiClients.delete(clientId);
      }
    });

    // Handle pong responses from client
    ws.on('pong', () => {
      ws.isAlive = true;
      if (this.uiClients.has(clientId)) {
        this.uiClients.get(clientId).lastPing = new Date().toISOString();
      }
      console.log(`UI client ${clientId} pong received`);
    });

    // Send initial connection confirmation with server info
    this.sendToUIClient(clientId, {
      type: 'connection',
      status: 'connected',
      clientId,
      authenticated: true,
      serverInfo: {
        connectedChargePoints: this.chargePoints.size,
        totalLogs: this.logs.length,
        serverTime: new Date().toISOString(),
        version: '1.6'
      },
      timestamp: new Date().toISOString()
    });

    console.log(`✅ UI client ${clientId} connected and authenticated from ${req.socket.remoteAddress}`);
  }

  handleChargePointConnection(ws, chargePointId, req) {
    console.log(`🔌 Charge Point ${chargePointId} attempting to connect from ${req.socket.remoteAddress}`);

    // Check if charge point is already connected
    if (this.chargePoints.has(chargePointId)) {
      const existingCP = this.chargePoints.get(chargePointId);
      if (existingCP.ws.readyState === WebSocket.OPEN) {
        existingCP.ws.close(1000, 'Replaced by new connection');
      }
    }

    // Ensure ws has isAlive property
    ws.isAlive = true;

    const chargePoint = {
      id: chargePointId,
      ws,
      status: 'Connected',
      connectedAt: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      messageCount: 0,
      ip: req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
     protocol: ws.protocol // This is the negotiated protocol
    };

    this.chargePoints.set(chargePointId, chargePoint);

    // Handle OCPP messages
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleOCPPMessage(chargePointId, message, 'incoming');
      } catch (error) {
        console.error(`Error parsing message from ${chargePointId}:`, error);
        this.logMessage(chargePointId, 'ERROR', `Invalid JSON: ${error.message}`, 'incoming');

        // Send error response for invalid JSON
        const errorResponse = [4, 'unknown', 'FormationViolation', 'Invalid JSON format', {}];
        ws.send(JSON.stringify(errorResponse));
      }
    });

    ws.on('close', (code, reason) => {
      console.log(`🔌 Charge Point ${chargePointId} disconnected: ${code} ${reason}`);
      if (this.chargePoints.has(chargePointId)) {
        this.chargePoints.get(chargePointId).status = 'Disconnected';
        // Remove from memory after 5 minutes to prevent memory leaks
        setTimeout(() => {
          if (this.chargePoints.has(chargePointId)) {
            const cp = this.chargePoints.get(chargePointId);
            if (cp.status === 'Disconnected') {
              this.chargePoints.delete(chargePointId);
              console.log(`🗑️ Removed disconnected charge point ${chargePointId} from memory`);
            }
          }
        }, 5 * 60 * 1000);
      }
      this.logMessage(chargePointId, 'CONNECTION', `Disconnected: ${code} ${reason}`, 'system');

      // Notify UI clients of disconnection
      this.broadcastToUIClients({
        type: 'chargePointDisconnected',
        chargePointId,
        timestamp: new Date().toISOString()
      });
    });

    ws.on('error', (error) => {
      console.error(`WebSocket error for ${chargePointId}:`, error);
      this.logMessage(chargePointId, 'ERROR', `WebSocket error: ${error.message}`, 'system');
    });

    this.logMessage(chargePointId, 'CONNECTION', `Charge Point Connected from ${req.socket.remoteAddress}`, 'system');
    this.broadcastToUIClients({
      type: 'chargePointConnected',
      chargePointId,
      chargePoint: {
        id: chargePointId,
        status: chargePoint.status,
        connectedAt: chargePoint.connectedAt,
        ip: chargePoint.ip
      },
      timestamp: new Date().toISOString()
    });
  }

  handleOCPPMessage(chargePointId, message, direction) {
    const chargePoint = this.chargePoints.get(chargePointId);
    if (chargePoint) {
      chargePoint.messageCount++;
      chargePoint.lastSeen = new Date().toISOString();

      // Mark connection as alive when message received
      if (chargePoint.ws && chargePoint.ws.readyState === WebSocket.OPEN) {
        chargePoint.ws.isAlive = true;
      }
    }

    const [messageType, messageId, action, payload] = message;

    // Log the message
    this.logMessage(chargePointId, action || 'RESPONSE', JSON.stringify(message), direction);

    // Handle different OCPP message types
    switch (messageType) {
      case 2: // Call
        this.handleOCPPCall(chargePointId, messageId, action, payload);
        break;
      case 3: // CallResult
        this.handleOCPPCallResult(chargePointId, messageId, payload);
        break;
      case 4: // CallError
        this.handleOCPPCallError(chargePointId, messageId, payload);
        break;
    }

    // Broadcast to UI clients
    this.broadcastToUIClients({
      type: 'ocppMessage',
      chargePointId,
      message,
      direction,
      timestamp: new Date().toISOString()
    });
  }

  async handleOCPPCall(chargePointId, messageId, action, payload) {
    const chargePoint = this.chargePoints.get(chargePointId);
    if (!chargePoint) return;
    // 🔥 Normalize protocol for DB usage
      chargePoint.normalizedProtocol =
        chargePoint.protocol === "ocpp2.0.1"
          ? "2.0.1"
          : "1.6";

    // Detect negotiated protocol
    const protocol = chargePoint.protocol || "ocpp1.6";

    console.log(`⚡ Routing ${action} using protocol: ${protocol}`);

    if (protocol === "ocpp2.0.1") {
      return this.handleOCPP201Call(chargePointId, messageId, action, payload);
    }

    // Default → OCPP 1.6 (FULL old logic)
    return this.handleOCPP16Call(chargePointId, messageId, action, payload);
  }
async handleOCPP16Call(chargePointId, messageId, action, payload) {

  const chargePoint = this.chargePoints.get(chargePointId);
  if (!chargePoint) return;

  let response;

  switch (action) {

    case 'BootNotification': {
      response = [3, messageId, {
        status: 'Accepted',
        currentTime: new Date().toISOString(),
        interval: 300
      }];
      chargePoint.status = 'Available';
      break;
    }

    case 'Heartbeat': {
      response = [3, messageId, {
        currentTime: new Date().toISOString()
      }];
      break;
    }

    case 'StatusNotification': {
      response = [3, messageId, {}];
      if (payload.status) {
        chargePoint.status = payload.status;
      }
      break;
    }

    case "Authorize": {
      response = [3, messageId, {
        idTagInfo: { status: "Accepted" }
      }];
      break;
    }

    case "StartTransaction": {

      const transactionId = Math.floor(Math.random() * 1000000).toString();

      const user = await User.findOne({
        $or: [
          { email: payload.idTag.trim() },
          { rfidTag: payload.idTag.trim() }
        ]
      });

      if (!user) {
        response = [3, messageId, {
          transactionId,
          idTagInfo: { status: "Invalid" }
        }];
        break;
      }

      await Transaction.create({
        transactionId,
        protocolVersion: "1.6", // ✅ ADD
        userId: user._id,
        chargerId: chargePointId,
        connectorId: payload.connectorId,
        idTag: payload.idTag,
        meterStart: payload.meterStart,
        startTime: new Date(payload.timestamp),
        status: "ACTIVE"
      });

      response = [3, messageId, {
        transactionId,
        idTagInfo: { status: "Accepted" }
      }];

      break;
    }

    case "MeterValues": {

      const transaction = await Transaction.findOne({
        transactionId: payload.transactionId?.toString()
      });

      if (transaction && payload.meterValue?.length) {

        const energy =
          Number(payload.meterValue[0]?.sampledValue?.[0]?.value || 0);

        transaction.meterStop = energy;
        transaction.energyConsumed =
          energy - transaction.meterStart;

        await transaction.save();

        global.ocppServer.broadcastToUIClients({
          type: "liveEnergyUpdate",
          transactionId: transaction.transactionId,
          energy: transaction.energyConsumed,
          chargerId: transaction.chargerId,
          timestamp: new Date().toISOString()
        });
      }

      response = [3, messageId, {}];
      break;
    }

    case "StopTransaction": {

      const transaction = await Transaction.findOne({
        transactionId: payload.transactionId?.toString()
      });

      if (transaction) {

        transaction.meterStop = payload.meterStop;
        transaction.energyConsumed =
          payload.meterStop - transaction.meterStart;

        transaction.endTime = new Date(payload.timestamp);
        transaction.status = "COMPLETED";

        await transaction.save();

        global.ocppServer.broadcastToUIClients({
          type: "transactionCompleted",
          transactionId: transaction.transactionId,
          energy: transaction.energyConsumed,
          chargerId: transaction.chargerId,
          timestamp: new Date().toISOString()
        });
      }

      response = [3, messageId, {
        idTagInfo: { status: "Accepted" }
      }];

      break;
    }

    default: {
      response = [4, messageId,
        "NotImplemented",
        `Action ${action} not implemented`,
        {}
      ];
      break;
    }
  }

  if (response) {
    chargePoint.ws.send(JSON.stringify(response));
    this.handleOCPPMessage(chargePointId, response, 'outgoing');
  }
}

async handleOCPP201Call(chargePointId, messageId, action, payload) {

  const chargePoint = this.chargePoints.get(chargePointId);
  if (!chargePoint) return;

  let response;

  switch (action) {

    // =====================================clc=====
    // BootNotification
    // ==========================================
    case "BootNotification": {
      response = [3, messageId, {
        status: "Accepted",
        currentTime: new Date().toISOString(),
        interval: 300
      }];

      chargePoint.status = "Available";
      break;
    }

    // ==========================================
    // Authorize
    // ==========================================
    case "Authorize": {
      response = [3, messageId, {
        idTokenInfo: { status: "Accepted" }
      }];
      break;
    }

    // ==========================================
    // TransactionEvent
    // ==========================================
    case "TransactionEvent": {

      const { eventType, transactionInfo, meterValue, timestamp } = payload;
      const transactionId = transactionInfo?.transactionId;

      if (!transactionId) {
        response = [4, messageId, "FormatViolation",
          "Missing transactionId", {}];
        break;
      }

      // ======================================
      // STARTED
      // ======================================
      if (eventType === "Started") {

        const meterStart =
          Number(meterValue?.[0]?.sampledValue?.[0]?.value || 0);

        await Transaction.findOneAndUpdate(
          { transactionId },
          {
            $setOnInsert: {
              transactionId,
              chargerId: chargePointId,
              protocolVersion:
                chargePoint.protocol === "ocpp2.0.1"
                  ? "2.0.1"
                  : "1.6",
              startTime: new Date(timestamp),
              meterStart,
              status: "ACTIVE"
            }
          },
          { upsert: true, new: true }
        );

        console.log("✅ Transaction ensured (safe upsert):", transactionId);

        global.ocppServer.broadcastToUIClients({
          type: "transactionStarted",
          transactionId,
          chargerId: chargePointId,
          timestamp: new Date().toISOString()
        });

        response = [3, messageId, {
          totalCost: 0,
          idTokenInfo: { status: "Accepted" }
        }];

        break;
      }
      // ======================================
      // UPDATED
      // ======================================
      if (eventType === "Updated") {

        const transaction =
          await Transaction.findOne({ transactionId });

        if (transaction) {

          const energy =
            Number(meterValue?.[0]?.sampledValue?.[0]?.value || 0);

          transaction.meterStop = energy;
          transaction.energyConsumed =
            energy - transaction.meterStart;

          await transaction.save();

          global.ocppServer.broadcastToUIClients({
            type: "liveEnergyUpdate",
            transactionId,
            energy: transaction.energyConsumed,
            chargerId: chargePointId,
            timestamp: new Date().toISOString()
          });
        }

        response = [3, messageId, {
          totalCost: 0,
          idTokenInfo: { status: "Accepted" }
        }];

        break;
      }

      // ======================================
      // ENDED
      // ======================================
      if (eventType === "Ended") {

        const transaction =
          await Transaction.findOne({ transactionId });

        if (transaction) {

          const stopEnergy =
            Number(meterValue?.[0]?.sampledValue?.[0]?.value || 0);

          transaction.meterStop = stopEnergy;
          transaction.energyConsumed =
            stopEnergy - transaction.meterStart;

          transaction.endTime = new Date(timestamp);
          transaction.status = "COMPLETED";

          // ==================================
          // 🔥 PRICING ENGINE
          // ==================================

          const durationSeconds =
            Math.floor(
              (transaction.endTime - transaction.startTime) / 1000
            );

          const durationMinutes = durationSeconds / 60;

          const energyKWh =
            transaction.energyConsumed / 1000;

          const RATE_PER_KWH = 12;      // ₹12 per kWh
          const RATE_PER_MINUTE = 1;    // ₹1 per minute
          const GST_PERCENT = 18;       // 18%

          const energyCost = energyKWh * RATE_PER_KWH;
          const timeCost = durationMinutes * RATE_PER_MINUTE;

          const subtotal = energyCost + timeCost;
          const tax = (subtotal * GST_PERCENT) / 100;
          const totalAmount = subtotal + tax;

          const roundedTotal =
            Number(totalAmount.toFixed(2));

          transaction.duration = durationSeconds;

          transaction.pricing = {
            ratePerKWh: RATE_PER_KWH,
            ratePerMinute: RATE_PER_MINUTE,
            energyCost: Number(energyCost.toFixed(2)),
            timeCost: Number(timeCost.toFixed(2)),
            tax: Number(tax.toFixed(2)),
            totalAmount: roundedTotal,
            currency: "INR"
          };

          await transaction.save();

          global.ocppServer.broadcastToUIClients({
            type: "transactionCompleted",
            transactionId,
            energy: transaction.energyConsumed,
            totalAmount: roundedTotal,
            chargerId: chargePointId,
            timestamp: new Date().toISOString()
          });

          response = [3, messageId, {
            totalCost: roundedTotal,
            idTokenInfo: { status: "Accepted" }
          }];

          break;
        }

        response = [4, messageId,
          "NotFound",
          "Transaction not found",
          {}];
        break;
      }

      break;
    }

    // ==========================================
    // Default
    // ==========================================
    default: {
      response = [4, messageId,
        "NotImplemented",
        `Action ${action} not supported in OCPP 2.0.1`,
        {}
      ];
      break;
    }
  }

  if (response) {
    chargePoint.ws.send(JSON.stringify(response));
    this.handleOCPPMessage(
      chargePointId,
      response,
      "outgoing"
    );
  }
}
  handleOCPPCallResult(chargePointId, messageId, payload) {
    console.log(`✅ CallResult from ${chargePointId}: ${messageId}`);
  }

  handleOCPPCallError(chargePointId, messageId, payload) {
    console.error(`❌ CallError from ${chargePointId}: ${messageId}`, payload);
  }

  handleUIMessage(clientId, message) {
    try {
      const client = this.uiClients.get(clientId);
      if (!client) {
        console.warn(`UI client ${clientId} not found in clients map`);
        return;
      }

      // Ensure client WebSocket is still open
      if (client.ws.readyState !== WebSocket.OPEN) {
        console.warn(`UI client ${clientId} WebSocket not open, removing client`);
        this.uiClients.delete(clientId);
        return;
      }

      // Handle ping messages to keep connection alive
      if (message.type === "ping") {
        client.ws.isAlive = true;
        client.lastPing = new Date().toISOString();

        this.sendToUIClient(clientId, {
          type: "pong",
          timestamp: new Date().toISOString(),
          serverTime: new Date().toISOString()
        });

        console.log(`Ping received from UI client ${clientId}, pong sent`);
        return;
      }

      // Handle authentication check
      if (message.type === "auth") {
        this.sendToUIClient(clientId, {
          type: "authStatus",
          authenticated: client.authenticated,
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Handle other message types
      switch (message.type) {
        case 'getChargePoints':
          try {
            // Send connected charge points to UI client
            const chargePointsData = Array.from(this.chargePoints.entries()).map(([id, cp]) => ({
              id,
              status: cp.status,
              connectedAt: cp.connectedAt,
              lastSeen: cp.lastSeen,
              messageCount: cp.messageCount,
              ip: cp.ip
            }));

            this.sendToUIClient(clientId, {
              type: 'chargePoints',
              data: chargePointsData,
              timestamp: new Date().toISOString()
            });
          } catch (error) {
            console.error(`Error getting charge points for UI client ${clientId}:`, error);
            this.sendToUIClient(clientId, {
              type: 'error',
              message: 'Failed to get charge points data',
              timestamp: new Date().toISOString()
            });
          }
          break;

        case 'getLogs':
          try {
            // Send logs to UI client
            const limit = Math.min(message.limit || 100, 1000); // Cap at 1000 logs
            const filteredLogs = this.logs
              .filter(log => {
                if (message.chargePointId && log.chargePointId !== message.chargePointId) return false;
                if (message.direction && log.direction !== message.direction) return false;
                if (message.action && log.action !== message.action) return false;
                return true;
              })
              .slice(-limit);

            this.sendToUIClient(clientId, {
              type: 'logs',
              data: filteredLogs,
              total: this.logs.length,
              filtered: filteredLogs.length,
              timestamp: new Date().toISOString()
            });
          } catch (error) {
            console.error(`Error getting logs for UI client ${clientId}:`, error);
            this.sendToUIClient(clientId, {
              type: 'error',
              message: 'Failed to get logs data',
              timestamp: new Date().toISOString()
            });
          }
          break;

        case 'sendCommand':
          try {
            // Send command to charge point
            if (!message.chargePointId || !message.command) {
              this.sendToUIClient(clientId, {
                type: 'error',
                message: 'Missing chargePointId or command',
                timestamp: new Date().toISOString()
              });
              return;
            }

            const success = this.sendCommandToChargePoint(
              message.chargePointId,
              message.command,
              message.payload || {}
            );

            this.sendToUIClient(clientId, {
              type: 'commandResult',
              success,
              chargePointId: message.chargePointId,
              command: message.command,
              message: success ? 'Command sent successfully' : 'Failed to send command - charge point not connected',
              timestamp: new Date().toISOString()
            });
          } catch (error) {
            console.error(`Error sending command for UI client ${clientId}:`, error);
            this.sendToUIClient(clientId, {
              type: 'error',
              message: 'Failed to send command',
              timestamp: new Date().toISOString()
            });
          }
          break;

        case 'getServerStatus':
          try {
            this.sendToUIClient(clientId, {
              type: 'serverStatus',
              data: {
                status: 'running',
                connectedChargePoints: this.chargePoints.size,
                connectedUIClients: this.uiClients.size,
                totalLogs: this.logs.length,
                uptime: process.uptime(),
                serverTime: new Date().toISOString(),
                version: '1.6'
              },
              timestamp: new Date().toISOString()
            });
          } catch (error) {
            console.error(`Error getting server status for UI client ${clientId}:`, error);
            this.sendToUIClient(clientId, {
              type: 'error',
              message: 'Failed to get server status',
              timestamp: new Date().toISOString()
            });
          }
          break;

        default:
          console.warn(`Unknown UI message type from client ${clientId}: ${message.type}`);
          this.sendToUIClient(clientId, {
            type: 'error',
            message: `Unknown message type: ${message.type}`,
            timestamp: new Date().toISOString()
          });
      }
    } catch (error) {
      console.error(`Error handling UI message from client ${clientId}:`, error);

      // Try to send error response if client is still connected
      try {
        this.sendToUIClient(clientId, {
          type: 'error',
          message: 'Internal server error processing message',
          timestamp: new Date().toISOString()
        });
      } catch (sendError) {
        console.error(`Failed to send error response to UI client ${clientId}:`, sendError);
        // Remove client if we can't communicate with it
        this.uiClients.delete(clientId);
      }
    }
  }

  sendCommandToChargePoint(chargePointId, command, payload = {}) {
    const chargePoint = this.chargePoints.get(chargePointId);
    if (chargePoint && chargePoint.ws.readyState === WebSocket.OPEN) {
      const messageId = uuidv4();
      const message = [2, messageId, command, payload]; // CALL message
      chargePoint.ws.send(JSON.stringify(message));
      this.handleOCPPMessage(chargePointId, message, 'outgoing');
      console.log(`📤 Command sent to ${chargePointId}: ${command}`);
      return true;
    }
    console.log(`❌ Failed to send command to ${chargePointId}: not connected`);
    return false;
  }

  sendToUIClient(clientId, message) {
    const client = this.uiClients.get(clientId);
    if (!client) {
      console.warn(`Cannot send message to UI client ${clientId}: client not found`);
      return false;
    }

    if (client.ws.readyState !== WebSocket.OPEN) {
      console.warn(`Cannot send message to UI client ${clientId}: WebSocket not open (state: ${client.ws.readyState})`);
      this.uiClients.delete(clientId);
      return false;
    }

    try {
      const messageStr = JSON.stringify(message);
      client.ws.send(messageStr);
      return true;
    } catch (error) {
      console.error(`Error sending message to UI client ${clientId}:`, error);

      // If send fails, clean up the client
      try {
        client.ws.close(1011, 'Send error');
      } catch (closeError) {
        console.error(`Error closing UI client ${clientId} after send failure:`, closeError);
      }

      this.uiClients.delete(clientId);
      return false;
    }
  }

  broadcastToUIClients(message) {
    this.uiClients.forEach((client, clientId) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
      }
    });
  }

  logMessage(chargePointId, action, content, direction) {
    const logEntry = {
      id: uuidv4(),
      chargePointId,
      action,
      content,
      direction, // 'incoming', 'outgoing', 'system'
      timestamp: new Date().toISOString(),
      level: direction === 'system' && action === 'ERROR' ? 'error' : 'info'
    };

    this.logs.push(logEntry);

    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Broadcast to UI clients immediately for real-time monitoring
    this.broadcastToUIClients({
      type: 'newLog',
      log: logEntry
    });

    // Enhanced console logging
    const logLevel = logEntry.level === 'error' ? 'error' : 'log';
    console[logLevel](`[${direction.toUpperCase()}] ${chargePointId} - ${action}: ${content}`);
  }

  start() {
    // Initialize OCPP WebSocket
    this.initializeOCPPWebSocket();

    // Start the server
    this.server.listen(this.port, () => {
      console.log(`🚀 Samku CMS Backend with OCPP WebSocket running on port ${this.port}`);
      console.log(`🌍 Environment: ${this.isDevelopment ? "Development" : "Production"}`);

      if (this.isDevelopment) {
        console.log(`📱 API Base URL: http://localhost:${this.port}/api`);
        console.log(`🔌 OCPP WebSocket URL: ws://localhost:${this.port}/ocpp/{charger-id}`);
      } else {
        console.log(`📱 API Base URL: https://cms-o4rp.onrender.com/api`);
        console.log(`🔌 OCPP WebSocket URL: wss://cms-o4rp.onrender.com/ocpp/{charger-id}`);
      }

      console.log(`📊 Dashboard: https://cms-o4rp.onrender.com`);
      console.log(`📝 Max logs in memory: ${this.maxLogs}`);
    });
  }

  // Graceful shutdown
  async shutdown() {
    console.log("🛑 Shutting down gracefully...");

    // Clear heartbeat interval
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
      console.log("✅ Heartbeat interval cleared");
    }

    // Close all charge point connections
    this.chargePoints.forEach((cp, id) => {
      try {
        if (cp.ws.readyState === WebSocket.OPEN) {
          cp.ws.close(1001, 'Server shutting down');
        }
      } catch (error) {
        console.error(`Error closing charge point ${id}:`, error);
      }
    });
    console.log(`✅ Closed ${this.chargePoints.size} charge point connections`);

    // Close all UI client connections
    this.uiClients.forEach((client, id) => {
      try {
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.close(1001, 'Server shutting down');
        }
      } catch (error) {
        console.error(`Error closing UI client ${id}:`, error);
      }
    });
    console.log(`✅ Closed ${this.uiClients.size} UI client connections`);

    // Close WebSocket server
    if (this.wss) {
      try {
        await new Promise((resolve) => {
          this.wss.close(() => {
            console.log('✅ WebSocket server closed');
            resolve();
          });
        });
      } catch (error) {
        console.error('Error closing WebSocket server:', error);
      }
    }

    // Close HTTP server and MongoDB connection
    if (this.server) {
      try {
        await new Promise((resolve) => {
          this.server.close(async () => {
            console.log('✅ HTTP server closed');

            // Close MongoDB connection using async/await (no callback)
            try {
              await mongoose.connection.close();
              console.log("✅ MongoDB connection closed");
            } catch (mongoError) {
              console.error("❌ Error closing MongoDB connection:", mongoError);
            }

            resolve();
          });
        });
      } catch (error) {
        console.error('Error during server shutdown:', error);
      }
    }

    console.log("✅ Graceful shutdown completed");
    process.exit(0);
  }
}

// Initialize and start server
const server = new SamkuCMSServer();
global.ocppServer = server; // Make OCPP server accessible globally for transactions
server.start();

// Graceful shutdown handling
process.on("SIGTERM", async () => {
  console.log("📡 Received SIGTERM signal");
  try {
    // Set a timeout for forced exit
    const forceExitTimeout = setTimeout(() => {
      console.log('⚠️ Forced exit after 10 seconds');
      process.exit(1);
    }, 10000);

    await server.shutdown();
    clearTimeout(forceExitTimeout);
  } catch (error) {
    console.error("❌ Error during SIGTERM shutdown:", error);
    process.exit(1);
  }
});

process.on("SIGINT", async () => {
  console.log("📡 Received SIGINT signal (Ctrl+C)");
  try {
    // Set a timeout for forced exit
    const forceExitTimeout = setTimeout(() => {
      console.log('⚠️ Forced exit after 10 seconds');
      process.exit(1);
    }, 10000);

    await server.shutdown();
    clearTimeout(forceExitTimeout);
  } catch (error) {
    console.error("❌ Error during SIGINT shutdown:", error);
    process.exit(1);
  }
});

// Handle unhandled promise rejections
// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Promise Rejection:", err);

  // ❗ DO NOT shutdown in development
  if (process.env.NODE_ENV === "production") {
    console.log("🚨 Production mode: exiting process");
    process.exit(1);
  } else {
    console.log("🛠 Development mode: server continues running");
  }
});

// Handle uncaught exceptions
process.on("uncaughtException", async (err) => {
  console.error("❌ Uncaught Exception:", err);
  try {
    const forceExitTimeout = setTimeout(() => {
      console.log('⚠️ Forced exit after 5 seconds due to uncaught exception');
      process.exit(1);
    }, 5000);

    await server.shutdown();
    clearTimeout(forceExitTimeout);
  } catch (shutdownError) {
    console.error("❌ Error during shutdown after uncaught exception:", shutdownError);
    process.exit(1);
  }
});

module.exports = server;
