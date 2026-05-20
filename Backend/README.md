# Samku CMS Backend

Backend API and OCPP WebSocket Server for the Samku EV Charging Management System.

## Features

- **RESTful API** for frontend communication
- **OCPP 1.6 WebSocket Server** for charger communication
- **MongoDB Atlas Integration** for data persistence
- **JWT Authentication** with role-based access control
- **Real-time Updates** via WebSocket
- **Comprehensive Validation** with express-validator
- **Rate Limiting** and security middleware

## Architecture

### Backend Components

1. **Express.js API Server** (Port 5000)
   - RESTful endpoints for CRUD operations
   - Authentication and authorization
   - Data validation and sanitization

2. **OCPP WebSocket Server** (Port 5001)
   - OCPP 1.6 protocol implementation
   - Real-time charger communication
   - Message logging and monitoring

3. **MongoDB Atlas Database**
   - Persistent data storage
   - Optimized indexing for performance
   - Automatic backups and scaling

### API Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/me` - Get current user

#### Stations
- `GET /api/stations` - Get all stations
- `POST /api/stations` - Create new station
- `GET /api/stations/:id` - Get station by ID
- `PUT /api/stations/:id` - Update station
- `DELETE /api/stations/:id` - Delete station
- `GET /api/stations/:id/chargers` - Get station chargers

#### Chargers
- `GET /api/chargers` - Get all chargers
- `POST /api/chargers` - Create new charger
- `GET /api/chargers/:id` - Get charger by ID
- `PUT /api/chargers/:id` - Update charger
- `DELETE /api/chargers/:id` - Delete charger
- `GET /api/chargers/:id/ocpp-url` - Get OCPP WebSocket URL

#### OCPP
- `POST /api/ocpp/generate-url` - Generate OCPP WebSocket URL
- `GET /api/ocpp/connected-chargers` - Get connected chargers
- `GET /api/ocpp/logs` - Get OCPP message logs
- `POST /api/ocpp/send-command` - Send command to charger

## Installation

1. **Install Dependencies**
   ```bash
   cd Backend
   npm install
   ```

2. **Setup Environment Variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Run Setup Script**
   ```bash
   node setup.js
   ```

## Configuration

### Environment Variables

- `NODE_ENV` - Environment (development/production)
- `PORT` - API server port (default: 5000)
- `OCPP_PORT` - OCPP WebSocket server port (default: 5001)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT secret key
- `JWT_EXPIRE` - JWT expiration time
- `FRONTEND_URL` - Frontend application URL

### MongoDB Atlas Setup

The backend connects to MongoDB Atlas using the provided connection string:
```
mongodb+srv://samkuservices:xcogeoi0Z68l2dYg@cluster0.nz60nte.mongodb.net/samku_cms
```

Database: `samku_cms`

Collections:
- `users` - User accounts and authentication
- `stations` - Charging stations
- `chargers` - Individual chargers/charge points
- `transactions` - Charging transactions
- `customers` - Customer information
- `rfidcards` - RFID card management

## Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

## OCPP Integration

### WebSocket URLs

The backend generates OCPP WebSocket URLs in the format:
- Development: `ws://localhost:5001/ocpp/{CHARGER_ID}`
- Production: `wss://cms-o4rp.onrender.com/ocpp/{CHARGER_ID}`

### Supported OCPP Messages

#### From Charger to Server (Incoming)
- `BootNotification` - Charger startup notification
- `Heartbeat` - Keep-alive messages
- `StatusNotification` - Charger status updates
- `Authorize` - RFID authorization requests
- `StartTransaction` - Transaction start notification
- `StopTransaction` - Transaction stop notification
- `MeterValues` - Energy consumption readings

#### From Server to Charger (Outgoing)
- `Reset` - Reset charger command
- `RemoteStartTransaction` - Start charging remotely
- `RemoteStopTransaction` - Stop charging remotely
- `ChangeConfiguration` - Update charger settings
- `GetConfiguration` - Retrieve charger settings

### Charger Connection Flow

1. Charger connects to WebSocket URL
2. Server validates connection and charger ID
3. Charger sends `BootNotification`
4. Server responds with acceptance
5. Regular `Heartbeat` messages maintain connection
6. Real-time status updates via `StatusNotification`
7. Transaction management via Start/Stop messages

## Database Models

### User Model
- Authentication and profile information
- Role-based permissions (ADMIN, HOST, USER, TECHNICIAN)
- Password hashing and security features

### Station Model
- Location and contact information
- Operating hours and amenities
- Host association and verification status

### Charger Model
- Hardware specifications (power type, capacity)
- OCPP connection details
- Status tracking and maintenance records
- Meter values and error codes

### Transaction Model
- Charging session details
- Energy consumption and pricing
- Payment status and billing

## Security Features

- **JWT Authentication** with secure token handling
- **Password Hashing** using bcrypt
- **Rate Limiting** to prevent abuse
- **Input Validation** and sanitization
- **CORS Configuration** for cross-origin requests
- **Helmet.js** for security headers

## Monitoring and Logging

- **Request Logging** with Morgan
- **Error Handling** with detailed error responses
- **OCPP Message Logging** for debugging
- **Connection Monitoring** for charger status

## Deployment

The backend is designed to be deployed on platforms like:
- Render.com (recommended)
- Heroku
- AWS/GCP/Azure
- VPS with Docker

### Render.com Deployment

1. Connect your GitHub repository
2. Set environment variables
3. Deploy with build command: `npm install`
4. Start command: `npm start`

## API Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": [ ... ]
}
```

## Support and Documentation

For detailed API documentation and troubleshooting:
- Check the `/health` endpoint for server status
- Review logs for error diagnostics
- Use the OCPP message logs for charger debugging

## License

MIT License - See LICENSE file for details.
