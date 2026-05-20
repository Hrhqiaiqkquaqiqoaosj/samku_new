import { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { Search, MapPin, QrCode, Zap, Edit, ChevronDown, ChevronUp, Plug, ExternalLink, Link } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import OcppConnectionModal from '../../components/ui/OcppConnectionModal';

const HostStations = ({ selectedClient }) => {
  const { stations, chargers } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [isStationDetailsOpen, setIsStationDetailsOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isOcppModalOpen, setIsOcppModalOpen] = useState(false);
  const [selectedStation, setSelectedStation] = useState(null);
  const [selectedCharger, setSelectedCharger] = useState(null);
  const [expandedStations, setExpandedStations] = useState([]);

  // Filter stations based on search query and selected client
  const filteredStations = stations.filter(station => {
    const matchesSearch = station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           station.address.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClient = selectedClient ? station.ownedBy === selectedClient : true;
    return matchesSearch && matchesClient;
  });

  // Function to toggle station expansion
  const toggleStationExpansion = (stationId) => {
    if (expandedStations.includes(stationId)) {
      setExpandedStations(expandedStations.filter(id => id !== stationId));
    } else {
      setExpandedStations([...expandedStations, stationId]);
    }
  };

  // Show QR code modal
  const handleShowQRCode = (station) => {
    setSelectedStation(station);
    setIsQrModalOpen(true);
  };

  // Handle OCPP connection for a charger
  const handleOcppConnection = (entity, type = 'charger') => {
    if (type === 'charger') {
      setSelectedCharger(entity);
      setSelectedStation(null);
    } else {
      setSelectedStation(entity);
      setSelectedCharger(null);
    }
    setIsOcppModalOpen(true);
  };

  // Get chargers for a specific station
  const getStationChargers = (stationId) => {
    return chargers.filter(charger => charger.stationId === stationId);
  };

  // Generate QR code content for a serial number
  const getQRCodeUrl = (serialNumber) => {
    // Generate a QR code URL using a public API
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(serialNumber)}`;
  };

  // Generate WebSocket connection URL for a charger
  const getChargerConnectionUrl = (serialNumber) => {
    return `wss://ocppsamku.devdotcom.in/${serialNumber}?token=${Math.random().toString(36).substring(2, 15)}`;
  };

  // Table columns
  const columns = [
    {
      header: '',
      accessor: (station) => (
        <button 
          onClick={() => toggleStationExpansion(station.id)}
          className="p-1 rounded-full hover:bg-gray-100 focus:outline-none"
        >
          {expandedStations.includes(station.id) ? 
            <ChevronUp size={18} className="text-gray-500" /> : 
            <ChevronDown size={18} className="text-gray-500" />}
        </button>
      ),
      width: '40px',
    },
    {
      header: 'Name',
      accessor: 'name',
    },
    {
      header: 'Location',
      accessor: (station) => (
        <div>
          <div>{station.address.area}</div>
          <div className="text-sm text-gray-500">{station.address.city}, {station.address.state}</div>
        </div>
      ),
    },
    {
      header: 'Contact',
      accessor: (station) => (
        <div>
          <div>{station.contactNumber}</div>
          <div className="text-sm text-gray-500">{station.contactEmail}</div>
        </div>
      ),
    },
    {
      header: 'Created At',
      accessor: 'createdAt',
    },
    {
      header: 'Actions',
      accessor: (station) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<QrCode size={16} />}
            title="Show QR Code"
            onClick={() => handleShowQRCode(station)}
          >
            QR
          </Button>
        </div>
      ),
    },
  ];

  // Expanded row renderer
  const renderExpandedRow = (station) => {
    const stationChargers = getStationChargers(station.id);
    return (
      <div className="px-4 py-3 bg-gray-50 dark:bg-slate-700 border-t border-b">
        <h4 className="text-md font-medium mb-3 flex items-center">
          <Plug size={18} className="mr-2 text-blue-500" />
          Chargers ({stationChargers.length})
        </h4>
        
        {stationChargers.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            No chargers found for this station
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stationChargers.map(charger => (
              <div key={charger.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-medium">{charger.name}</h5>
                    <p className="text-sm text-gray-500">{charger.serialNumber}</p>
                    <div className="mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium inline-block ${
                        charger.status === 'ONLINE' ? 'bg-green-100 text-green-800' :
                        charger.status === 'OFFLINE' ? 'bg-red-100 text-red-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {charger.status}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">{charger.powerType} • {charger.capacity}</span>
                    </div>
                  </div>
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<QrCode size={16} />}
                      onClick={() => handleShowQRCode({ serialNumber: charger.serialNumber })}
                      className="mb-2"
                    >
                      QR
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Link size={16} />}
                      onClick={() => handleOcppConnection(charger)}
                      className="mb-2 ml-2"
                    >
                      OCPP
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">
          {selectedClient ? `${selectedClient} Stations` : 'My Stations'}
        </h1>
      </div>
      
      <Card>
        <div className="mb-4 flex items-center">
          <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search stations"
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <Table
          columns={columns}
          data={filteredStations}
          keyField="id"
          expandableRows
          expandedRowIds={expandedStations}
          renderExpandedRow={renderExpandedRow}
        />

        {filteredStations.length === 0 && (
          <div className="text-center py-8 border-t">
            <MapPin size={48} className="mx-auto text-gray-400" />
            <p className="text-gray-500 mt-2">No stations found matching your search criteria</p>
          </div>
        )}
      </Card>

      {/* QR Code Modal */}
      <Modal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        title={`QR Code for ${selectedStation?.name || selectedStation?.serialNumber}`}
        footer={
          <Button variant="outline" onClick={() => setIsQrModalOpen(false)}>Close</Button>
        }
      >
        <div className="flex flex-col items-center justify-center p-4">
          <img 
            src={getQRCodeUrl(selectedStation?.serialNumber || selectedStation?.contactNumber || selectedStation?.id)} 
            alt="QR Code" 
            className="w-64 h-64" 
          />
          <p className="mt-4 text-center text-gray-600">
            {selectedStation?.serialNumber || selectedStation?.contactNumber || selectedStation?.id}
          </p>
        </div>
      </Modal>

      {/* OCPP Connection Modal */}
      <OcppConnectionModal
        isOpen={isOcppModalOpen}
        onClose={() => setIsOcppModalOpen(false)}
        entity={selectedCharger || selectedStation}
        entityType={selectedCharger ? 'charger' : 'station'}
      />
    </div>
  );
};

export default HostStations;