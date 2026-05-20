import { useState, useEffect, useRef } from 'react';
import { useData } from '../../contexts/DataContext';
import { PlusCircle, Edit, Trash2, Search, ChevronRight, Server, Plug, QrCode, Link, RefreshCw, Wifi, WifiOff, Activity, AlertCircle } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import OcppConnectionModal from '../../components/ui/OcppConnectionModal';

const AdminChargers = () => {
  const { 
    chargers, 
    stations, 
    addCharger, 
    updateCharger, 
    deleteCharger, 
    fetchChargers, 
    wsConnected,
    wsReconnectAttempts,
    setupWebSocket,
    sendCommandToCharger,
    requestChargerStatus
  } = useData();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isOcppModalOpen, setIsOcppModalOpen] = useState(false);
  const [selectedCharger, setSelectedCharger] = useState(null);
  const [selectedStation, setSelectedStation] = useState(null);
  const [formData, setFormData] = useState({
    serialNumber: '',
    name: '',
    powerType: 'AC',
    capacity: '',
    stationId: '',
    connectorType: 'Type2',
    numberOfConnectors: 1,
    maxPower: ''
  });
  const [refreshingStatus, setRefreshingStatus] = useState(false);
  const [localChargers, setLocalChargers] = useState([]);
  const [lastMessage, setLastMessage] = useState(null);
  const wsRef = useRef(null);

  // Initialize local chargers state from props
  useEffect(() => {
    setLocalChargers(chargers.map(charger => ({
      ...charger,
      status: 'Disconnected', // Start with all chargers as disconnected
      isOnline: false,
      lastSeen: charger.lastSeen || 'Never'
    })));
  }, [chargers]);

  // Initial data fetch when component mounts
  useEffect(() => {
    const initializeData = async () => {
      console.log("Initializing chargers component data");
      
      // Fetch chargers data
      await fetchChargers();
      
      // Request charger statuses from WebSocket only if connected
      if (window.socket && window.socket.readyState === WebSocket.OPEN) {
        console.log("Requesting initial charger statuses from WebSocket server");
        window.socket.send(JSON.stringify({ type: "getChargePoints" }));
      } else if (!wsConnected) {
        // Try to establish WebSocket connection if not connected
        console.log("WebSocket not connected, attempting to connect");
        setupWebSocket();
      }
    };
    
    initializeData();
  }, []);

  // Set up WebSocket message listener for real-time updates
  useEffect(() => {
    // Function to handle WebSocket messages
    const handleWebSocketMessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Filter out log messages that aren't relevant to charger status
        if (data.type === "log" || data.type === "getLogs" || data.type === "logs" || data.type === "newLog") {
          return;
        }
        
        // Only store relevant messages about charger status
        if (["chargePointConnected", "chargePointDisconnected", "ocppMessage", "chargePoints"].includes(data.type)) {
          setLastMessage({
            type: data.type,
            timestamp: new Date().toISOString(),
            chargePointId: data.chargePointId || null,
            status: data.type === "chargePointConnected" ? "Connected" : 
                   data.type === "chargePointDisconnected" ? "Disconnected" : null
          });
          
          console.log(`WebSocket status update: ${data.type}`);
        }
        
        // Handle different message types
        if (data.type === "chargePointConnected") {
          console.log("Charger connected:", data.chargePointId);
          handleChargerStatusChange(data.chargePointId, "Connected", data.timestamp);
        } 
        else if (data.type === "chargePointDisconnected") {
          console.log("Charger disconnected:", data.chargePointId);
          handleChargerStatusChange(data.chargePointId, "Disconnected", data.timestamp);
        }
        else if (data.type === "ocppMessage") {
          // Handle OCPP messages that might contain status updates
          if (data.message && Array.isArray(data.message) && data.message.length >= 3) {
            const [messageType, messageId, action, payload] = data.message;
            
            // Handle StatusNotification messages
            if (messageType === 2 && action === "StatusNotification" && payload && payload.status) {
              console.log(`Status notification for ${data.chargePointId}: ${payload.status}`);
              handleChargerStatusChange(data.chargePointId, payload.status, data.timestamp);
            }
            
            // Handle StartTransaction messages
            if (messageType === 2 && action === "StartTransaction") {
              console.log(`Start transaction for ${data.chargePointId}`);
              handleChargerStatusChange(data.chargePointId, "Charging", data.timestamp);
            }
            
            // Handle StopTransaction messages
            if (messageType === 2 && action === "StopTransaction") {
              console.log(`Stop transaction for ${data.chargePointId}`);
              handleChargerStatusChange(data.chargePointId, "Available", data.timestamp);
            }
          }
        }
        else if (data.type === "chargePoints") {
          // Update all chargers with the latest status from the server
          if (data.data && Array.isArray(data.data)) {
            console.log("Received chargePoints data with " + data.data.length + " chargers");
            
            // Update chargers based on actual WebSocket connections
            updateAllChargersStatus(data.data);
          }
        }
      } catch (error) {
        console.error("Error handling WebSocket message:", error);
      }
    };

    // Attach event listener to the WebSocket if it exists
    if (window.socket && window.socket.readyState === WebSocket.OPEN) {
      wsRef.current = window.socket;
      window.socket.addEventListener("message", handleWebSocketMessage);
      
      // Request initial charger status
      console.log("Requesting initial charger status");
      window.socket.send(JSON.stringify({ type: "getChargePoints" }));
    }

    // Cleanup function to remove event listener
    return () => {
      if (wsRef.current) {
        wsRef.current.removeEventListener("message", handleWebSocketMessage);
      }
    };
  }, []);

  // Function to update all chargers with status from server
  const updateAllChargersStatus = (serverChargers) => {
    console.log("Updating all chargers with server data:", serverChargers);
    
    setLocalChargers(prevChargers => {
      const updatedChargers = prevChargers.map(charger => {
        // Find matching charger from server data by comparing IDs and serial numbers
        const serverCharger = serverChargers.find(sc => {
          if (!sc.id) return false;
          
          const scId = String(sc.id).toLowerCase();
          const chargerId = charger.id ? String(charger.id).toLowerCase() : '';
          const chargerSerial = charger.serialNumber ? String(charger.serialNumber).toLowerCase() : '';
          
          // Check for any type of match
          const isMatch = scId === chargerSerial || scId === chargerId || chargerSerial === scId;
          
          if (isMatch) {
            console.log(`MATCH FOUND: Server charger ${scId} matches local charger ${chargerSerial || chargerId}`);
          }
          
          return isMatch;
        });
        
        if (serverCharger) {
          console.log(`Updating charger: ${charger.serialNumber || charger.id} with status ${serverCharger.status}`);
          return {
            ...charger,
            status: serverCharger.status,
            lastSeen: serverCharger.lastSeen || charger.lastSeen,
            connectedAt: serverCharger.connectedAt || charger.connectedAt,
            isOnline: serverCharger.status.toLowerCase() === "connected"
          };
        } else {
          // If charger is not in server data, mark as disconnected
          return {
            ...charger,
            status: "Disconnected",
            isOnline: false
          };
        }
      });
      
      return updatedChargers;
    });
  };

  // Function to update a specific charger's status
  const handleChargerStatusChange = (chargerId, status, timestamp, connectedAt = null) => {
    console.log(`Attempting to update charger ${chargerId} status to ${status}`);
    
    setLocalChargers(prevChargers => {
      const updatedChargers = prevChargers.map(charger => {
        // Try multiple ways to match the charger ID
        const chargerIdLower = String(chargerId || '').toLowerCase();
        const chargerSerialLower = String(charger.serialNumber || '').toLowerCase();
        const chargerIdValueLower = String(charger.id || '').toLowerCase();
        
        // Check for exact match
        const isMatch = chargerSerialLower === chargerIdLower || chargerIdValueLower === chargerIdLower;
        
        if (isMatch) {
          console.log(`Match found! Updating charger ${charger.serialNumber || charger.id} status from ${charger.status} to ${status}`);
          
          const currentTime = new Date().toISOString();
          const updatedLastSeen = timestamp || currentTime;
          
          const updatedConnectedAt = status.toLowerCase() === 'connected' ? 
            (connectedAt || currentTime) : 
            (charger.connectedAt || null);
            
          return {
            ...charger,
            status: status,
            lastSeen: updatedLastSeen,
            connectedAt: updatedConnectedAt,
            isOnline: status.toLowerCase() === "connected"
          };
        }
        return charger;
      });
      
      return updatedChargers;
    });
  };

  // Refresh charger statuses periodically - only when WebSocket is connected
  useEffect(() => {
    if (wsConnected && window.socket && window.socket.readyState === WebSocket.OPEN) {
      // Set up interval to refresh every 30 seconds
      const intervalId = setInterval(() => {
        console.log("Requesting charger status update via WebSocket");
        window.socket.send(JSON.stringify({ type: "getChargePoints" }));
      }, 30000);
      
      return () => clearInterval(intervalId);
    }
  }, [wsConnected]);
  
  // Refresh charger statuses manually
  const refreshChargerStatuses = async () => {
    setRefreshingStatus(true);
    
    try {
      // Fetch latest charger data from API
      await fetchChargers();
      
      // Request all charger statuses from WebSocket server if connected
      if (window.socket && window.socket.readyState === WebSocket.OPEN) {
        console.log("Requesting charger statuses from WebSocket server");
        window.socket.send(JSON.stringify({ type: "getChargePoints" }));
      } else {
        console.log("WebSocket not connected, cannot refresh real-time status");
      }
    } catch (error) {
      console.error("Error refreshing charger statuses:", error);
    } finally {
      setTimeout(() => setRefreshingStatus(false), 1000);
    }
  };

  // Handle OCPP connection for a charger
  const handleOcppConnection = (charger) => {
    setSelectedCharger(charger);
    setIsOcppModalOpen(true);
  };

  // Generate WebSocket connection URL for a charger
  const getChargerConnectionUrl = (serialNumber) => {
    // Always use the deployed URL for WebSocket connections
    const baseUrl = 'wss://cms-backend-nkfp.onrender.com/ocpp';
    
    // Generate a random token for connection
    const token = Math.random().toString(36).substring(2, 15);
    
    return `${baseUrl}/${serialNumber}?token=${token}`;
  };

  // Filter stations based on search query
  const filteredStations = stations.filter(station => {
    return station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           station.ownedBy?.toLowerCase().includes(searchQuery.toLowerCase());
  });
  
  // Get filtered chargers based on search query, status filter and selected station
  const getFilteredChargers = (stationId) => {
    console.log('Filtering chargers for stationId:', stationId);
    console.log('Available chargers:', localChargers);
    
    const filtered = localChargers.filter(charger => {
      const matchesSearch = charger.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           charger.serialNumber?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter ? charger.status?.toLowerCase() === statusFilter.toLowerCase() : true;
      
      // Handle various ID formats for comparison
      let chargerStationId = charger.stationId;
      if (typeof chargerStationId === 'object' && chargerStationId !== null) {
        // If stationId is an object with _id property (populated MongoDB document)
        chargerStationId = chargerStationId._id || chargerStationId.id;
      }
      
      // Convert to strings for comparison if they're not already
      const stationIdStr = String(stationId);
      const chargerStationIdStr = String(chargerStationId);
      
      const matchesStation = stationIdStr === chargerStationIdStr;
      
      return matchesSearch && matchesStatus && matchesStation;
    });
    
    console.log('Filtered chargers:', filtered);
    return filtered;
  };
  
  // Calculate station statistics using localChargers instead of chargers
  const getStationStats = (stationId) => {
    // Convert to string for consistent comparison
    const stationIdStr = String(stationId);
    
    const stationChargers = localChargers.filter(charger => {
      // Handle various ID formats
      let chargerStationId = charger.stationId;
      if (typeof chargerStationId === 'object' && chargerStationId !== null) {
        chargerStationId = chargerStationId._id || chargerStationId.id;
      }
      
      return String(chargerStationId) === stationIdStr;
    });
    
    const online = stationChargers.filter(c => c.status === 'ONLINE' || c.status === 'Available' || c.status === 'Connected').length;
    const offline = stationChargers.filter(c => c.status === 'OFFLINE' || c.status === 'Disconnected' || c.status === 'Unavailable').length;
    const charging = stationChargers.filter(c => c.status === 'Charging' || c.status === 'CHARGING').length;
    const faulted = stationChargers.filter(c => c.status === 'Faulted' || c.status === 'FAULTED').length;
    
    return {
      total: stationChargers.length,
      online,
      offline,
      charging,
      faulted
    };
  };
  
  // Get color class based on charger status
  const getStatusColorClass = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300';
    
    const statusLower = String(status).toLowerCase();
    
    if (statusLower === 'online' || statusLower === 'available' || statusLower === 'connected') {
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    } else if (statusLower === 'offline' || statusLower === 'unavailable' || statusLower === 'disconnected') {
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    } else if (statusLower === 'charging') {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    } else if (statusLower === 'faulted' || statusLower === 'error') {
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
    } else {
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300';
    }
  };
  
  // Handle station selection
  const handleStationSelect = (station) => {
    console.log('Selected station:', station);
    // Ensure we're using MongoDB _id format
    if (station._id) {
      station.id = station._id;
    } else if (station.id && !station._id) {
      station._id = station.id;
    }
    setSelectedStation(station);
  };

  // Handle back to stations list
  const handleBackToStations = () => {
    setSelectedStation(null);
  };
  
  // Handle input change for add/edit form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log(`Form field ${name} changed:`, value);
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Open add modal
  const handleAddClick = () => {
    setFormData({
      serialNumber: '',
      name: '',
      powerType: 'AC',
      capacity: '',
      stationId: selectedStation ? (selectedStation._id || selectedStation.id) : '',
      connectorType: 'Type2',
      numberOfConnectors: 1,
      maxPower: ''
    });
    setIsAddModalOpen(true);
  };
  
  // Open edit modal
  const handleEditClick = (charger) => {
    setSelectedCharger(charger);
    setFormData({
      serialNumber: charger.serialNumber,
      name: charger.name,
      powerType: charger.powerType || 'AC',
      capacity: charger.capacity,
      stationId: charger.stationId,
      connectorType: charger.connectorType || 'Type2',
      numberOfConnectors: charger.numberOfConnectors || 1,
      maxPower: charger.maxPower || ''
    });
    setIsEditModalOpen(true);
    console.log('Editing charger with stationId:', charger.stationId);
  };

  // Open delete modal
  const handleDeleteClick = (charger) => {
    setSelectedCharger(charger);
    setIsDeleteModalOpen(true);
  };
  
  // Handle add charger submission
  const handleAddSubmit = async () => {
    // Validate form
    if (!formData.serialNumber || !formData.name || !formData.capacity || !formData.stationId) {
      alert('Please fill all required fields');
      return;
    }

    // Validate serial number format
    const serialNumberRegex = /^[A-Z0-9_-]+$/;
    if (!serialNumberRegex.test(formData.serialNumber.trim())) {
      alert('Serial number can only contain uppercase letters, numbers, underscores and hyphens');
      return;
    }

    // Validate that stationId is a valid MongoDB ObjectId
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    if (!objectIdRegex.test(formData.stationId)) {
      alert('Invalid station ID format. Please select a valid station.');
      console.error('Invalid stationId format:', formData.stationId);
      return;
    }

    // Create new charger formatted according to backend model requirements
    const newCharger = {
      serialNumber: formData.serialNumber.toUpperCase().trim(),
      name: formData.name.trim(),
      stationId: formData.stationId,
      powerType: formData.powerType || 'AC',
      capacity: formData.capacity.trim(),
    };

    console.log('Adding charger with stationId:', formData.stationId);
    console.log('Selected station:', selectedStation);
    console.log('Selected station ID:', selectedStation?._id || selectedStation?.id);;

    // Add optional fields only if they have valid values
    if (formData.connectorType) {
      newCharger.connectorType = formData.connectorType;
    }
    
    if (formData.numberOfConnectors && !isNaN(parseInt(formData.numberOfConnectors))) {
      newCharger.numberOfConnectors = parseInt(formData.numberOfConnectors);
    }
    
    if (formData.maxPower && !isNaN(parseFloat(formData.maxPower))) {
      newCharger.maxPower = parseFloat(formData.maxPower);
    }
    
    try {
      console.log('Submitting charger with data:', JSON.stringify(newCharger));
      await addCharger(newCharger);
      setIsAddModalOpen(false);
      
      // Refresh chargers list to ensure the new charger is displayed correctly
      console.log('Charger added successfully, refreshing chargers list');
      await fetchChargers();
    } catch (error) {
      console.error('Error adding charger:', error);
      alert(`Failed to add charger: ${error.response?.data?.message || error.message || "Unknown error occurred"}`);
    }
  };
  
  // Handle edit charger submission
  const handleEditSubmit = async () => {
    // Validate form
    if (!formData.serialNumber || !formData.name || !formData.capacity || !formData.stationId) {
      alert('Please fill all required fields');
      return;
    }

    // Validate serial number format
    const serialNumberRegex = /^[A-Z0-9_-]+$/;
    if (!serialNumberRegex.test(formData.serialNumber.trim())) {
      alert('Serial number can only contain uppercase letters, numbers, underscores and hyphens');
      return;
    }

    // Create updated charger formatted according to backend model requirements
    const updatedCharger = {
      serialNumber: formData.serialNumber.toUpperCase().trim(),
      name: formData.name.trim(),
      stationId: formData.stationId,
      powerType: formData.powerType || 'AC',
      capacity: formData.capacity.trim(),
    };

    // Add optional fields only if they have valid values
    if (formData.connectorType) {
      updatedCharger.connectorType = formData.connectorType;
    }
    
    if (formData.numberOfConnectors && !isNaN(parseInt(formData.numberOfConnectors))) {
      updatedCharger.numberOfConnectors = parseInt(formData.numberOfConnectors);
    }
    
    if (formData.maxPower && !isNaN(parseFloat(formData.maxPower))) {
      updatedCharger.maxPower = parseFloat(formData.maxPower);
    }

    try {
      await updateCharger(selectedCharger.id || selectedCharger._id, updatedCharger);
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error updating charger:', error);
      alert(`Failed to update charger: ${error.response?.data?.message || error.message || "Unknown error occurred"}`);
    }
  };

  // Handle delete charger
  const handleDeleteSubmit = () => {
    deleteCharger(selectedCharger.id);
    setIsDeleteModalOpen(false);
  };

  // Table columns for chargers view
  const columns = [
    {
      header: 'Serial Number',
      accessor: 'serialNumber',
    },
    {
      header: 'Name',
      accessor: 'name',
    },
    {
      header: 'Power Type',
      accessor: 'powerType',
    },
    {
      header: 'Status',
      accessor: (charger) => {
        console.log(`Rendering status for charger ${charger.serialNumber}: ${charger.status}`);
        const status = charger.status || 'Unknown';
        const statusLower = String(status).toLowerCase();
        
        // Define status icons based on status
        let StatusIcon = () => null;
        let statusDescription = '';
        
        if (statusLower === 'online' || statusLower === 'available' || statusLower === 'connected') {
          StatusIcon = () => <Wifi size={14} className="mr-1" />;
          statusDescription = 'Ready for charging';
        } else if (statusLower === 'charging') {
          StatusIcon = () => <Activity size={14} className="mr-1 animate-pulse" />;
          statusDescription = 'Currently charging a vehicle';
        } else if (statusLower === 'offline' || statusLower === 'unavailable' || statusLower === 'disconnected') {
          StatusIcon = () => <WifiOff size={14} className="mr-1" />;
          statusDescription = 'Not connected to network';
        } else if (statusLower === 'faulted' || statusLower === 'error') {
          StatusIcon = () => <AlertCircle size={14} className="mr-1" />;
          statusDescription = 'Error detected';
        }
        
        // Format timestamps
        const formatTime = (timestamp) => {
          if (!timestamp) return 'Never';
          try {
            return new Date(timestamp).toLocaleTimeString();
          } catch (e) {
            return 'Invalid date';
          }
        };
        
        const lastSeenTime = formatTime(charger.lastSeen);
        const connectedTime = formatTime(charger.connectedAt);
        
        return (
          <div className="flex flex-col">
            <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${getStatusColorClass(charger.status)}`}>
              <StatusIcon />
              {status}
            </span>
            <span className="text-xs text-gray-500 mt-1">{statusDescription}</span>
            
            {/* Connection information */}
            <div className="mt-1 space-y-0.5">
              {charger.lastSeen && (
                <div className="flex items-center text-xs text-gray-400">
                  <span className="w-16 inline-block">Last seen:</span> 
                  <span className="font-medium">{lastSeenTime}</span>
                </div>
              )}
              
              {statusLower === 'connected' && charger.connectedAt && (
                <div className="flex items-center text-xs text-green-500">
                  <span className="w-16 inline-block">Connected:</span> 
                  <span className="font-medium">{connectedTime}</span>
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      header: 'Last Seen',
      accessor: (charger) => charger.lastSeen ? new Date(charger.lastSeen).toLocaleString() : 'Never',
    },
    {
      header: 'Actions',
      accessor: (charger) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Activity size={16} />}
            onClick={(e) => {
              e.stopPropagation();
              // Request status update for this specific charger
              if (wsConnected && charger.serialNumber) {
                console.log(`Requesting status update for ${charger.serialNumber}`);
                requestChargerStatus(charger.serialNumber);
              }
            }}
          >
            Status
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Link size={16} />}
            onClick={(e) => {
              e.stopPropagation();
              handleOcppConnection(charger);
            }}
          >
            OCPP
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Edit size={16} />}
            onClick={(e) => {
              e.stopPropagation();
              handleEditClick(charger);
            }}
          >
            Edit
          </Button>
          <Button
            variant="danger"
            size="sm"
            leftIcon={<Trash2 size={16} />}
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteClick(charger);
            }}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">
          {selectedStation ? `${selectedStation.name} - Chargers` : 'Station Details & Available Chargers'}
        </h1>
        
        {selectedStation && (
          <div className="flex space-x-4">
            <Button
              variant="outline"
              onClick={handleBackToStations}
            >
              Back to Stations
            </Button>
            <Button
              variant="primary"
              leftIcon={<PlusCircle size={20} />}
              onClick={handleAddClick}
            >
              Add Charger
            </Button>
          </div>
        )}
      </div>
      
      {/* WebSocket Connection Status */}
      <div className={`flex flex-col md:flex-row items-start md:items-center justify-between px-4 py-3 rounded-md ${wsConnected ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
        <div className="flex items-center">
          {wsConnected ? (
            <>
              <Wifi size={18} className="mr-2" />
              <div>
                <span className="text-sm font-medium">Connected to OCPP Server</span>
                {lastMessage && lastMessage.timestamp && (
                  <div className="text-xs mt-0.5">
                    Last update: {new Date(lastMessage.timestamp).toLocaleTimeString()}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <WifiOff size={18} className="mr-2" />
              <div>
                <span className="text-sm font-medium">Disconnected from OCPP Server</span>
                <div className="text-xs mt-0.5">
                  Reconnection attempts: {wsReconnectAttempts}
                </div>
              </div>
            </>
          )}
        </div>
        <div className="mt-2 md:mt-0">
          {wsConnected ? (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw size={16} className={refreshingStatus ? "animate-spin" : ""} />}
              onClick={refreshChargerStatuses}
              disabled={refreshingStatus}
            >
              {refreshingStatus ? "Refreshing..." : "Refresh Status"}
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<RefreshCw size={16} />}
              onClick={setupWebSocket}
            >
              Reconnect
            </Button>
          )}
        </div>
      </div>
      
      {/* Removed WebSocket debug logs display to improve UI experience */}
      
      {/* Search and Filter */}
      <Card>
        <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder={selectedStation ? "Search by charger name or serial number" : "Search by station name"}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {selectedStation && (
            <div className="w-full md:w-auto">
              <select
                className="px-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="Connected">Connected</option>
                <option value="Available">Available</option>
                <option value="Charging">Charging</option>
                <option value="Disconnected">Disconnected</option>
                <option value="Unavailable">Unavailable</option>
                <option value="Faulted">Faulted</option>
                <option value="ONLINE">ONLINE</option>
                <option value="OFFLINE">OFFLINE</option>
              </select>
            </div>
          )}
        </div>
        
        {/* Show either stations grid or chargers table based on selection */}
        {!selectedStation ? (
          // Stations Grid View
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStations.length > 0 ? (
              filteredStations.map(station => {
                const stationId = station._id || station.id;
                const stats = getStationStats(stationId);
                return (
                  <div 
                    key={stationId} 
                    className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleStationSelect(station)}
                  >
                    <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg mr-3">
                            <Server size={20} />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{station.name}</h3>
                        </div>
                        <ChevronRight size={20} className="text-gray-400" />
                      </div>
                      <p className="mt-2 text-sm text-gray-500">{station.address?.area || ''}, {station.address?.city || ''}</p>
                    </div>
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full mr-3">
                            <Plug size={18} />
                          </div>
                          <h4 className="text-md font-medium text-gray-700 dark:text-gray-300">Chargers</h4>
                        </div>
                        <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 text-xs font-medium py-1 px-2 rounded-full">
                          {stats.total} Total
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded text-center">
                          <div className="flex items-center justify-center mb-1">
                            <Wifi size={14} className="text-green-600 dark:text-green-400 mr-1" />
                            <span className="text-sm font-medium text-green-700 dark:text-green-400">{stats.online}</span>
                          </div>
                          <p className="text-xs text-green-600 dark:text-green-500">Online</p>
                        </div>
                        <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded text-center">
                          <div className="flex items-center justify-center mb-1">
                            <WifiOff size={14} className="text-red-600 dark:text-red-400 mr-1" />
                            <span className="text-sm font-medium text-red-700 dark:text-red-400">{stats.offline}</span>
                          </div>
                          <p className="text-xs text-red-600 dark:text-red-500">Offline</p>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded text-center">
                          <div className="flex items-center justify-center mb-1">
                            <Activity size={14} className={`text-blue-600 dark:text-blue-400 mr-1 ${stats.charging > 0 ? 'animate-pulse' : ''}`} />
                            <span className="text-sm font-medium text-blue-700 dark:text-blue-400">{stats.charging}</span>
                          </div>
                          <p className="text-xs text-blue-600 dark:text-blue-500">Charging</p>
                        </div>
                        <div className="bg-orange-50 dark:bg-orange-900/20 p-2 rounded text-center">
                          <div className="flex items-center justify-center mb-1">
                            <AlertCircle size={14} className="text-orange-600 dark:text-orange-400 mr-1" />
                            <span className="text-sm font-medium text-orange-700 dark:text-orange-400">{stats.faulted}</span>
                          </div>
                          <p className="text-xs text-orange-600 dark:text-orange-500">Faulted</p>
                        </div>
                      </div>
                      
                      {/* Last Status Update Indicator */}
                      {stats.total > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Status updated
                            </span>
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                              {new Date().toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full text-center py-12">
                <Server size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">No stations found</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Try adjusting your search criteria</p>
              </div>
            )}
          </div>
        ) : (
          // Chargers Table View for Selected Station
          <>
            <Table
              columns={columns}
              data={getFilteredChargers(selectedStation._id || selectedStation.id)}
              keyField="id"
            />
            
            {getFilteredChargers(selectedStation._id || selectedStation.id).length === 0 && (
              <div className="text-center py-12">
                <Plug size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">No chargers found</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  {searchQuery || statusFilter ? 'Try adjusting your search or filter criteria' : 'Add a charger to get started'}
                </p>
              </div>
            )}
          </>
        )}
      </Card>
      
      {/* Add Charger Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Charger"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAddSubmit}>Add Charger</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Serial Number *</label>
            <input
              type="text"
              name="serialNumber"
              value={formData.serialNumber}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="CH-XXX-YYYY"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Must contain only uppercase letters, numbers, underscores and hyphens</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Charger Name"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Power Type *</label>
            <select
              name="powerType"
              value={formData.powerType}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="AC">AC</option>
              <option value="DC">DC</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Capacity (kW) *</label>
            <input
              type="text"
              name="capacity"
              value={formData.capacity}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. 75 kW"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Max Power (kW)</label>
            <input
              type="number"
              name="maxPower"
              value={formData.maxPower}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. 75"
              min="0"
              step="0.1"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Connector Type</label>
            <select
              name="connectorType"
              value={formData.connectorType}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Type2">Type 2</option>
              <option value="CCS">CCS</option>
              <option value="CHAdeMO">CHAdeMO</option>
              <option value="Type1">Type 1</option>
              <option value="GB/T">GB/T</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Number of Connectors</label>
            <input
              type="number"
              name="numberOfConnectors"
              value={formData.numberOfConnectors}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              min="1"
              max="4"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Station *</label>
            <select
              name="stationId"
              value={formData.stationId}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select a Station</option>
              {stations.map(station => {
                // Ensure we're using the MongoDB _id for the backend
                const stationId = station._id ? station._id : station.id;
                console.log('Station option:', station.name, 'ID:', stationId);
                return (
                  <option key={stationId} value={stationId}>
                    {station.name}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </Modal>
      
      {/* Edit Charger Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Charger"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleEditSubmit}>Update Charger</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Serial Number *</label>
            <input
              type="text"
              name="serialNumber"
              value={formData.serialNumber}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="CH-XXX-YYYY"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Must contain only uppercase letters, numbers, underscores and hyphens</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Charger Name"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Power Type *</label>
            <select
              name="powerType"
              value={formData.powerType}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="AC">AC</option>
              <option value="DC">DC</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Capacity (kW) *</label>
            <input
              type="text"
              name="capacity"
              value={formData.capacity}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. 75 kW"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Max Power (kW)</label>
            <input
              type="number"
              name="maxPower"
              value={formData.maxPower}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. 75"
              min="0"
              step="0.1"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Connector Type</label>
            <select
              name="connectorType"
              value={formData.connectorType}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Type2">Type 2</option>
              <option value="CCS">CCS</option>
              <option value="CHAdeMO">CHAdeMO</option>
              <option value="Type1">Type 1</option>
              <option value="GB/T">GB/T</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Number of Connectors</label>
            <input
              type="number"
              name="numberOfConnectors"
              value={formData.numberOfConnectors}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              min="1"
              max="4"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Station *</label>
            <select
              name="stationId"
              value={formData.stationId}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select a Station</option>
              {stations.map(station => {
                // Ensure we're using the MongoDB _id for the backend
                const stationId = station._id ? station._id : station.id;
                console.log('Station option:', station.name, 'ID:', stationId);
                return (
                  <option key={stationId} value={stationId}>
                    {station.name}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Charger"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDeleteSubmit}>Delete</Button>
          </>
        }
      >
        <p>Are you sure you want to delete the charger "{selectedCharger?.name}"?</p>
        <p className="text-sm text-red-500 mt-2">This action cannot be undone.</p>
      </Modal>

      {/* OCPP Connection Modal */}
      <OcppConnectionModal
        isOpen={isOcppModalOpen}
        onClose={() => setIsOcppModalOpen(false)}
        entity={selectedCharger}
        entityType="charger"
      />
    </div>
  );
};

export default AdminChargers;