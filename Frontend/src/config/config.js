// Base API URL - Use development URL when running locally
const isDevelopment =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname === '10.48.115.31';

const API_BASE_URL = isDevelopment
  ?'http://localhost:5000/api'
  : 'https://samku112.onrender.com/api';
// API Endpoints
export const API_ENDPOINTS = {  // Auth endpoints
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
    REFRESH_TOKEN: `${API_BASE_URL}/auth/refresh-token`,
    FORGOT_PASSWORD: `${API_BASE_URL}/auth/forgot-password`,
    RESET_PASSWORD: `${API_BASE_URL}/auth/reset-password`,
    VERIFY_EMAIL: `${API_BASE_URL}/auth/verify-email`,
    PROFILE: `${API_BASE_URL}/auth/me`,
  },
  
  // Stats endpoints
  STATS: {
    DASHBOARD: `${API_BASE_URL}/stats/dashboard`,
    HOSTS: `${API_BASE_URL}/stats/hosts`,
  },
  
  // User endpoints
  USER: {
    PROFILE: `${API_BASE_URL}/users/profile`,
    UPDATE_PROFILE: `${API_BASE_URL}/users/profile`,
    CHANGE_PASSWORD: `${API_BASE_URL}/users/change-password`,
  },
  
  // Charger endpoints
  CHARGERS: {
    BASE: `${API_BASE_URL}/chargers`,
    GET_ALL: `${API_BASE_URL}/chargers`,
    GET_BY_ID: (id) => `${API_BASE_URL}/chargers/${id}`,
    CREATE: `${API_BASE_URL}/chargers`,
    UPDATE: (id) => `${API_BASE_URL}/chargers/${id}`,
    DELETE: (id) => `${API_BASE_URL}/chargers/${id}`,
    GET_BY_STATION: (stationId) => `${API_BASE_URL}/chargers/station/${stationId}`,
  },
  
  // Station endpoints
  STATIONS: {
    BASE: `${API_BASE_URL}/stations`,
    GET_ALL: `${API_BASE_URL}/stations`,
    GET_BY_ID: (id) => `${API_BASE_URL}/stations/${id}`,
    CREATE: `${API_BASE_URL}/stations`,
    UPDATE: (id) => `${API_BASE_URL}/stations/${id}`,
    DELETE: (id) => `${API_BASE_URL}/stations/${id}`,
    GET_BY_HOST: (hostId) => `${API_BASE_URL}/stations/host/${hostId}`,
  },
  
  // Host endpoints
  HOSTS: {
    BASE: `${API_BASE_URL}/hosts`,
    GET_ALL: `${API_BASE_URL}/hosts`,
    GET_BY_ID: (id) => `${API_BASE_URL}/hosts/${id}`,
    CREATE: `${API_BASE_URL}/hosts`,
    UPDATE: (id) => `${API_BASE_URL}/hosts/${id}`,
    DELETE: (id) => `${API_BASE_URL}/hosts/${id}`,
  },
  
  // Transaction endpoints
  TRANSACTIONS: {
    BASE: `${API_BASE_URL}/transactions`,
    GET_ALL: `${API_BASE_URL}/transactions`,
    GET_BY_ID: (id) => `${API_BASE_URL}/transactions/${id}`,
    CREATE: `${API_BASE_URL}/transactions`,
    UPDATE: (id) => `${API_BASE_URL}/transactions/${id}`,
    GET_BY_CUSTOMER: (customerId) => `${API_BASE_URL}/transactions/customer/${customerId}`,
    GET_BY_STATION: (stationId) => `${API_BASE_URL}/transactions/station/${stationId}`,
    GET_BY_CHARGER: (chargerId) => `${API_BASE_URL}/transactions/charger/${chargerId}`,
  },
  
  // Wallet endpoints
  WALLET: {
    BASE: `${API_BASE_URL}/wallet`,
    GET_BALANCE: (userId) => `${API_BASE_URL}/wallet/${userId}/balance`,
    ADD_MONEY: `${API_BASE_URL}/wallet/add-money`,
    GET_HISTORY: (userId) => `${API_BASE_URL}/wallet/${userId}/history`,
  },
  
  // RFID endpoints
  RFID: {
    BASE: `${API_BASE_URL}/rfid`,
    GET_ALL: `${API_BASE_URL}/rfid`,
    GET_BY_ID: (id) => `${API_BASE_URL}/rfid/${id}`,
    CREATE: `${API_BASE_URL}/rfid`,
    UPDATE: (id) => `${API_BASE_URL}/rfid/${id}`,
    DELETE: (id) => `${API_BASE_URL}/rfid/${id}`,
    GET_BY_CUSTOMER: (customerId) => `${API_BASE_URL}/rfid/customer/${customerId}`,
  },
    // Customer endpoints
  CUSTOMERS: {
    BASE: `${API_BASE_URL}/customers`,
    GET_ALL: `${API_BASE_URL}/customers`,
    GET_BY_ID: (id) => `${API_BASE_URL}/customers/${id}`,
    CREATE: `${API_BASE_URL}/customers`,
    UPDATE: (id) => `${API_BASE_URL}/customers/${id}`,
    DELETE: (id) => `${API_BASE_URL}/customers/${id}`,
  },

  // OCPP endpoints
  OCPP: {
    BASE: `${API_BASE_URL}/ocpp`,
    GENERATE_URL: `${API_BASE_URL}/ocpp/generate-url`,
    CONNECTED_CHARGERS: `${API_BASE_URL}/ocpp/connected-chargers`,
    LOGS: `${API_BASE_URL}/ocpp/logs`,
    SEND_COMMAND: `${API_BASE_URL}/ocpp/send-command`,
    SERVER_STATUS: `${API_BASE_URL}/ocpp/server-status`,
  },
};

// WebSocket configuration - Use secure websocket for production, but try ws for development
// Using regular ws protocol for development to avoid self-signed certificate issues
export const WEBSOCKET_URL = isDevelopment 
  ? 'wss://samku112.onrender.com'
  : 'wss://samku112.onrender.com';

// ✅ ADD THIS
export const OCPP_BASE_URL = isDevelopment
  ? "ws://localhost:5000/ocpp"
 : 'https://samku112.onrender.com/api';
// App configuration
export const APP_CONFIG = {
  DEFAULT_PAGE_SIZE: 10,
  DATE_FORMAT: 'yyyy-MM-dd HH:mm:ss',
  NOTIFICATION_TIMEOUT: 5000, // milliseconds
  IDLE_TIMEOUT: 30 * 60 * 1000, // 30 minutes in milliseconds
};

// Mapbox configuration (if using maps)
export const MAP_CONFIG = {
  MAPBOX_TOKEN: 'your_mapbox_token_here',
  DEFAULT_CENTER: [78.9629, 20.5937], // Longitude and Latitude for center of India
  DEFAULT_ZOOM: 5,
};

export default {
  API_ENDPOINTS,
  WEBSOCKET_URL,
  APP_CONFIG,
  MAP_CONFIG,
};

//
