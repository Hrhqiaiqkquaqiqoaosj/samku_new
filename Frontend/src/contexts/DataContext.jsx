import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { API_ENDPOINTS } from "../config/config.js";

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used inside DataProvider");
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const [chargers, setChargers] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [wsConnected, setWsConnected] = useState(false);
  const [wsConnecting, setWsConnecting] = useState(false);
  const [wsReconnectAttempts, setWsReconnectAttempts] = useState(0);

  /* ================= AXIOS ================= */

  const api = axios.create({
    timeout: 10000,
    headers: { "Content-Type": "application/json" },
  });

  api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  });

  /* ================= INITIAL LOAD ================= */

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      fetchChargers();
      fetchTransactions();
      setupWebSocket();
    }

    return () => {
      cleanupWebSocket();
    };
  }, []);

  /* ================= WEBSOCKET ================= */

  const setupWebSocket = () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    if (wsConnecting || wsConnected) return;

    setWsConnecting(true);

    if (window.socket) {
      window.socket.close();
    }

    const wsUrl = `ws://localhost:5000/ocpp/ui-client?token=${token}`;

    console.log("🔌 Connecting to UI WebSocket:", wsUrl);

    try {
      const socket = new WebSocket(wsUrl);
      window.socket = socket;

      socket.onopen = () => {
        console.log("✅ UI WebSocket Connected");
        setWsConnected(true);
        setWsConnecting(false);
        setWsReconnectAttempts(0);
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("📩 WS Message:", data);

          if (data.type === "chargePoints" && Array.isArray(data.data)) {
            setChargers(data.data);
          }
        } catch (err) {
          console.error("Message parse error:", err);
        }
      };

      socket.onerror = (error) => {
        console.error("❌ WebSocket Error:", error);
      };

      socket.onclose = (event) => {
        console.log("❌ WebSocket Closed:", event.code);

        setWsConnected(false);
        setWsConnecting(false);

        // reconnect max 3 times
        if (wsReconnectAttempts < 3) {
          setTimeout(() => {
            setWsReconnectAttempts((prev) => prev + 1);
            setupWebSocket();
          }, 3000);
        }
      };
    } catch (error) {
      console.error("WebSocket setup failed:", error);
      setWsConnecting(false);
    }
  };

  const cleanupWebSocket = () => {
    if (window.socket) {
      window.socket.close();
      window.socket = null;
    }
    setWsConnected(false);
  };

  const reconnectWebSocket = () => {
    console.log("🔄 Manual reconnect");
    cleanupWebSocket();
    setTimeout(() => {
      setupWebSocket();
    }, 1000);
  };

  /* ================= API CALLS ================= */

  const fetchChargers = async () => {
    try {
      const res = await api.get(API_ENDPOINTS.CHARGERS.GET_ALL);
      if (res.data.success) {
        setChargers(res.data.data);
      }
    } catch (err) {
      console.error("Fetch chargers error:", err);
      setChargers([]);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await api.get(API_ENDPOINTS.TRANSACTIONS.GET_ALL);
      if (res.data.success) {
        setTransactions(res.data.data);
      }
    } catch (err) {
      console.error("Fetch transactions error:", err);
      setTransactions([]);
    }
  };

  /* ================= SEND COMMAND ================= */

  const sendCommandToCharger = (chargerId, command, payload = {}) => {
    if (!window.socket || window.socket.readyState !== WebSocket.OPEN) {
      console.error("WebSocket not connected");
      return false;
    }

    window.socket.send(
      JSON.stringify({
        type: "sendCommand",
        chargePointId: chargerId,
        command,
        payload,
        timestamp: new Date().toISOString(),
      })
    );

    return true;
  };

  /* ================= PROVIDER ================= */

  return (
    <DataContext.Provider
      value={{
        chargers,
        transactions,
        fetchChargers,
        fetchTransactions,
        wsConnected,
        wsConnecting,
        wsReconnectAttempts,
        reconnectWebSocket,
        sendCommandToCharger,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};
