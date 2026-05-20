import { useState } from "react";
import { useData } from "../../contexts/DataContext";
import {
  PlusCircle,
  Edit,
  Trash2,
  Search,
  MapPin,
  QrCode,
  ChevronDown,
  ChevronUp,
  Plug,
  ExternalLink,
  X,
  Link,
} from "lucide-react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Table from "../../components/ui/Table";
import Modal from "../../components/ui/Modal";
import OcppConnectionModal from "../../components/ui/OcppConnectionModal";
import { QRCodeSVG } from "qrcode.react";

const AdminStations = ({ selectedClient }) => {
  const {
    stations,
    chargers,
    hosts,
    addStation,
    updateStation,
    deleteStation,
  } = useData();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isOcppModalOpen, setIsOcppModalOpen] = useState(false);
  const [selectedStation, setSelectedStation] = useState(null);
  const [selectedCharger, setSelectedCharger] = useState(null);
  const [expandedStations, setExpandedStations] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    ownedBy: "",
    contactNumber: "",
    contactEmail: "",
    address: {
      area: "",
      state: "",
      city: "",
      country: "India",
      postalCode: "",
      latitude: "",
      longitude: "",
    },
    hostId: "",
  });

  // Filter stations based on search query and selected client
  const filteredStations = stations.filter((station) => {
    const matchesSearch =
      station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      station.ownedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
      station.address.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClient = selectedClient
      ? station.ownedBy === selectedClient
      : true;
    return matchesSearch && matchesClient;
  });

  // Function to toggle station expansion
  const toggleStationExpansion = (stationId) => {
    if (expandedStations.includes(stationId)) {
      setExpandedStations(expandedStations.filter((id) => id !== stationId));
    } else {
      setExpandedStations([...expandedStations, stationId]);
    }
  };

  // Handle input change for add/edit form
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name.includes(".")) {
      // Handle nested address fields
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Open add modal
  const handleAddClick = () => {
    setFormData({
      name: "",
      ownedBy: selectedClient || "",
      contactNumber: "",
      contactEmail: "",
      address: {
        area: "",
        state: "",
        city: "",
        country: "India",
        postalCode: "",
        latitude: "",
        longitude: "",
      },
      hostId: "",
    });
    setIsAddModalOpen(true);
  };

  // Open edit modal
  const handleEditClick = (station) => {
    setSelectedStation(station);
    setFormData({
      name: station.name,
      ownedBy: station.ownedBy,
      contactNumber: station.contactNumber,
      contactEmail: station.contactEmail,
      address: { ...station.address },
      hostId: station.hostId,
    });
    setIsEditModalOpen(true);
  };

  // Open delete modal
  const handleDeleteClick = (station) => {
    setSelectedStation(station);
    setIsDeleteModalOpen(true);
  };

  // Show QR code modal
  const handleShowQRCode = (station) => {
    setSelectedStation(station);
    setIsQrModalOpen(true);
  };

  // Handle OCPP connection for a charger or station
  const handleOcppConnection = (entity, type = "charger") => {
    if (type === "charger") {
      setSelectedCharger(entity);
      setSelectedStation(null);
    } else {
      setSelectedStation(entity);
      setSelectedCharger(null);
    }
    setIsOcppModalOpen(true);
  };

  // Handle add station submission
  const handleAddSubmit = async () => {
    // Validate form
    if (
      !formData.name ||
      !formData.ownedBy ||
      !formData.contactNumber ||
      !formData.contactEmail ||
      !formData.hostId ||
      !formData.address.area ||
      !formData.address.city ||
      !formData.address.state ||
      !formData.address.postalCode
    ) {
      alert("Please fill all required fields");
      return;
    }

    // Format the data to match backend requirements
    const newStation = {
      name: formData.name,
      ownedBy: formData.ownedBy,
      hostId: formData.hostId,
      address: {
        area: formData.address.area,
        city: formData.address.city,
        state: formData.address.state,
        country: formData.address.country || "India",
        pincode: formData.address.postalCode, // Map postalCode to pincode
        coordinates: {
          latitude: formData.address.latitude ? parseFloat(formData.address.latitude) : null,
          longitude: formData.address.longitude ? parseFloat(formData.address.longitude) : null
        }
      },
      contact: {
        phone: formData.contactNumber.trim(),
        email: formData.contactEmail.trim()
      },
      // Set default operating hours as required by the backend
      operatingHours: {
        open: "09:00",
        close: "21:00",
        is24x7: false
      },
      amenities: ["parking"]
    };

    console.log("Submitting new station:", newStation);
    console.log("Current stations count:", stations.length);

    try {
      const result = await addStation(newStation);
      if (result) {
        // If we got a result, the station was added successfully
        console.log("Station added successfully:", result);
        console.log("Updated stations count:", stations.length);
        setIsAddModalOpen(false);
        
        // Force a re-render by toggling a state variable
        const forceUpdate = () => {
          // This is a trick to force a re-render
          setSearchQuery(prevQuery => {
            // Set it to the same value to avoid changing the filter
            return prevQuery;
          });
        };
        
        // Use setTimeout to ensure the state update happens after the modal closes
        setTimeout(forceUpdate, 100);
      } else {
        // If no result but also no error, something went wrong
        console.warn("No station returned from addStation, but no error thrown");
        // Close the modal anyway since the station might have been created
        setIsAddModalOpen(false);
      }
    } catch (error) {
      console.error("Error in handleAddSubmit:", error);
      // Don't show an alert if the station was actually created
      // The DataContext now handles this case and returns the station
      if (error.message && error.message.includes("Failed to create station")) {
        console.log("Station may have been created despite error, closing modal");
        setIsAddModalOpen(false);
        
        // Force a re-render by toggling a state variable
        const forceUpdate = () => {
          // This is a trick to force a re-render
          setSearchQuery(prevQuery => {
            // Set it to the same value to avoid changing the filter
            return prevQuery;
          });
        };
        
        // Use setTimeout to ensure the state update happens after the modal closes
        setTimeout(forceUpdate, 100);
      } else {
        alert(`Failed to add station: ${error.message}`);
      }
    }
  };

  // Handle edit station submission
  const handleEditSubmit = async () => {
    // Validate form
    if (
      !formData.name ||
      !formData.ownedBy ||
      !formData.contactNumber ||
      !formData.contactEmail ||
      !formData.hostId ||
      !formData.address.area ||
      !formData.address.city ||
      !formData.address.state ||
      !formData.address.postalCode
    ) {
      alert("Please fill all required fields");
      return;
    }

    // Format the data to match backend requirements
    const updatedStation = {
      name: formData.name,
      ownedBy: formData.ownedBy,
      hostId: formData.hostId,
      address: {
        area: formData.address.area,
        city: formData.address.city,
        state: formData.address.state,
        country: formData.address.country || "India",
        pincode: formData.address.postalCode, // Map postalCode to pincode
        coordinates: {
          latitude: formData.address.latitude ? parseFloat(formData.address.latitude) : null,
          longitude: formData.address.longitude ? parseFloat(formData.address.longitude) : null
        }
      },
      contact: {
        phone: formData.contactNumber.trim(),
        email: formData.contactEmail.trim()
      },
      operatingHours: {
        open: "09:00",
        close: "21:00",
        is24x7: false
      }
    };

    try {
      await updateStation(selectedStation.id || selectedStation._id, updatedStation);
      setIsEditModalOpen(false);
    } catch (error) {
      alert(`Failed to update station: ${error.message}`);
    }
  };

  // Handle delete station
  const handleDeleteSubmit = () => {
    deleteStation(selectedStation.id);
    setIsDeleteModalOpen(false);
  };

  // Get chargers for a specific station
  const getStationChargers = (stationId) => {
    return chargers.filter((charger) => charger.stationId === stationId);
  };

  // Generate unique QR value for a station or charger
  const getQRCodeValue = (item) => {
    if (item.serialNumber) {
      return `CHRG:${item.serialNumber}:${item.name}:${
        new Date().toISOString().split("T")[0]
      }`;
    } else {
      return `STN:${item.id}:${item.name}:${item.ownedBy}:${
        new Date().toISOString().split("T")[0]
      }`;
    }
  };

  // Generate WebSocket connection URL for a charger
  const getChargerConnectionUrl = (serialNumber) => {
    // Always use the deployed URL for WebSocket connections
    const baseUrl = 'wss://cms-o4rp.onrender.com/ocpp';
    
    // Generate a random token for connection
    const token = Math.random().toString(36).substring(2, 15);
    
    return `${baseUrl}/${serialNumber}?token=${token}`;
  };

  // Print QR code
  const handlePrintQR = () => {
    const printWindow = window.open("", "_blank");
    const qrValue = selectedStation?.serialNumber
      ? `CHRG:${selectedStation.serialNumber}`
      : `STN:${selectedStation.id}:${selectedStation.name}`;

    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${
            selectedStation?.name || selectedStation?.serialNumber
          }</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              text-align: center;
            }
            .qr-container {
              display: flex;
              flex-direction: column;
              align-items: center;
              margin: 50px auto;
            }
            .qr-title {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 15px;
            }
            .qr-id {
              font-size: 14px;
              color: #666;
              margin-top: 15px;
              margin-bottom: 30px;
            }
            .qr-image {
              border: 1px solid #ddd;
              padding: 15px;
              background: white;
            }
            .print-info {
              margin-top: 50px;
              color: #999;
              font-size: 12px;
            }
            @media print {
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div class="qr-title">${
              selectedStation?.name || "Charger"
            } - QR Code</div>
            <div class="qr-image">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                qrValue
              )}" width="250" height="250" alt="QR Code" />
            </div>
            <div class="qr-id">${
              selectedStation?.serialNumber || selectedStation?.id
            }</div>
            <p class="no-print">
              <button onclick="window.print();" style="padding: 8px 15px; background: #4a89dc; color: white; border: none; border-radius: 4px; cursor: pointer;">Print QR Code</button>
            </p>
          </div>
          <div class="print-info">
            Generated on ${new Date().toLocaleDateString()} | ${
      selectedStation?.ownedBy || "EV Charging Network"
    }
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                document.querySelector('button').focus();
              }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Table columns
  const columns = [
    {
      header: "",
      accessor: (station) => (
        <button
          onClick={() => toggleStationExpansion(station.id)}
          className="p-1 rounded-full hover:bg-gray-100 focus:outline-none"
        >
          {expandedStations.includes(station.id) ? (
            <ChevronUp size={18} className="text-gray-500" />
          ) : (
            <ChevronDown size={18} className="text-gray-500" />
          )}
        </button>
      ),
      width: "40px",
    },
    {
      header: "Name",
      accessor: "name",
    },
    {
      header: "Owned By",
      accessor: "ownedBy",
    },
    {
      header: "Location",
      accessor: (station) => (
        <div>
          <div>{station.address.area}</div>
          <div className="text-sm text-gray-500">
            {station.address.city}, {station.address.state}
          </div>
        </div>
      ),
    },
    {
      header: "Contact",
      accessor: (station) => (
        <div>
          <div>{station.contactNumber}</div>
          <div className="text-sm text-gray-500">{station.contactEmail}</div>
        </div>
      ),
    },
    {
      header: "Created At",
      accessor: "createdAt",
    },
    {
      header: "Actions",
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
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Edit size={16} />}
            onClick={() => handleEditClick(station)}
          >
            Edit
          </Button>
          <Button
            variant="danger"
            size="sm"
            leftIcon={<Trash2 size={16} />}
            onClick={() => handleDeleteClick(station)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  // Expanded row renderer for showing chargers
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
            {stationChargers.map((charger) => (
              <div
                key={charger.id}
                className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-medium">{charger.name}</h5>
                    <p className="text-sm text-gray-500">
                      {charger.serialNumber}
                    </p>
                    <div className="mt-1">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium inline-block ${
                          charger.status === "ONLINE"
                            ? "bg-green-100 text-green-800"
                            : charger.status === "OFFLINE"
                            ? "bg-red-100 text-red-800"
                            : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {charger.status}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">
                        {charger.powerType} • {charger.capacity}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<QrCode size={16} />}
                        onClick={() =>
                          handleShowQRCode({
                            serialNumber: charger.serialNumber,
                            name: charger.name,
                          })
                        }
                        className="mb-2"
                      >
                        QR
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Link size={16} />}
                        onClick={() => handleOcppConnection(charger, "charger")}
                        className="mb-2 ml-2"
                      >
                        OCPP
                      </Button>
                    </div>
                    {charger.status === "ONLINE" && (
                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<ExternalLink size={16} />}
                        onClick={() =>
                          window.open(
                            getChargerConnectionUrl(charger.serialNumber),
                            "_blank"
                          )
                        }
                      >
                        Connect
                      </Button>
                    )}
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
          {selectedClient ? `${selectedClient} Stations` : "All Stations"}
        </h1>
        <Button
          variant="primary"
          leftIcon={<PlusCircle size={20} />}
          onClick={handleAddClick}
        >
          Add Station
        </Button>
      </div>

      <Card>
        <div className="mb-4 flex items-center">
          <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search charging stations"
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
            <p className="text-gray-500 mt-2">
              No stations found matching your search criteria
            </p>
          </div>
        )}
      </Card>

      {/* QR Code Modal */}
      <Modal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        title={`QR Code for ${
          selectedStation?.name || selectedStation?.serialNumber || ""
        }`}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsQrModalOpen(false)}>
              Close
            </Button>
            <Button variant="primary" onClick={handlePrintQR}>
              Print
            </Button>
          </>
        }
      >
        <div className="flex flex-col items-center justify-center p-4">
          <div className="border border-gray-200 p-4 rounded-lg bg-white">
            <QRCodeSVG
              value={getQRCodeValue(selectedStation || {})}
              size={250}
              level="H"
              includeMargin={true}
              bgColor="#FFFFFF"
              fgColor="#000000"
            />
          </div>
          <div className="mt-5 text-center">
            <p className="font-medium text-gray-900">
              {selectedStation?.serialNumber || selectedStation?.id}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {selectedStation?.serialNumber ? "Charger" : "Station"} QR Code
            </p>
          </div>
        </div>
      </Modal>

      {/* Add Station Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Station"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddSubmit}>
              Add Station
            </Button>
          </>
        }
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Station Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. Central City Station"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Owned By *
            </label>
            <input
              type="text"
              name="ownedBy"
              value={formData.ownedBy}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. Metro Energy"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Contact Number *
              </label>
              <input
                type="text"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="+91 9876543210"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Contact Email *
              </label>
              <input
                type="email"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="station@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Host *
            </label>
            <select
              name="hostId"
              value={formData.hostId}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select a Host</option>
              {Array.isArray(hosts) &&
                hosts.map((host) => (
                  <option key={host.id || host._id} value={host.id || host._id}>
                    {host.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="border-t border-gray-200 pt-4 mt-4">
            <h3 className="text-lg font-medium text-gray-800 mb-2">Address</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Area *
              </label>
              <input
                type="text"
                name="address.area"
                value={formData.address.area}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. Downtown"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  City *
                </label>
                <input
                  type="text"
                  name="address.city"
                  value={formData.address.city}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="City"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  State *
                </label>
                <input
                  type="text"
                  name="address.state"
                  value={formData.address.state}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="State/Province"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Country *
                </label>
                <input
                  type="text"
                  name="address.country"
                  value={formData.address.country}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Country"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Postal Code *
                </label>
                <input
                  type="text"
                  name="address.postalCode"
                  value={formData.address.postalCode}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Postal/ZIP Code"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Latitude
                </label>
                <input
                  type="text"
                  name="address.latitude"
                  value={formData.address.latitude}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g. 19.0760"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Longitude
                </label>
                <input
                  type="text"
                  name="address.longitude"
                  value={formData.address.longitude}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g. 72.8777"
                />
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Edit Station Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Station"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleEditSubmit}>
              Update Station
            </Button>
          </>
        }
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Station Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. Central City Station"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Owned By *
            </label>
            <input
              type="text"
              name="ownedBy"
              value={formData.ownedBy}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. Metro Energy"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Contact Number *
              </label>
              <input
                type="text"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="+91 9876543210"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Contact Email *
              </label>
              <input
                type="email"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="station@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Host *
            </label>
            <select
              name="hostId"
              value={formData.hostId}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select a Host</option>
              {Array.isArray(hosts) &&
                hosts.map((host) => (
                  <option key={host.id || host._id} value={host.id || host._id}>
                    {host.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="border-t border-gray-200 pt-4 mt-4">
            <h3 className="text-lg font-medium text-gray-800 mb-2">Address</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Area *
              </label>
              <input
                type="text"
                name="address.area"
                value={formData.address.area}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. Downtown"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  City *
                </label>
                <input
                  type="text"
                  name="address.city"
                  value={formData.address.city}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="City"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  State *
                </label>
                <input
                  type="text"
                  name="address.state"
                  value={formData.address.state}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="State/Province"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Country *
                </label>
                <input
                  type="text"
                  name="address.country"
                  value={formData.address.country}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Country"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Postal Code *
                </label>
                <input
                  type="text"
                  name="address.postalCode"
                  value={formData.address.postalCode}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Postal/ZIP Code"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Latitude
                </label>
                <input
                  type="text"
                  name="address.latitude"
                  value={formData.address.latitude}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g. 19.0760"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Longitude
                </label>
                <input
                  type="text"
                  name="address.longitude"
                  value={formData.address.longitude}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g. 72.8777"
                />
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Station"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteSubmit}>
              Delete
            </Button>
          </>
        }
      >
        <p>
          Are you sure you want to delete the station "{selectedStation?.name}"?
        </p>
        <p className="text-sm text-red-500 mt-2">
          This action cannot be undone and will also delete all associated
          chargers.
        </p>
      </Modal>

      {/* OCPP Connection Modal */}
      <OcppConnectionModal
        isOpen={isOcppModalOpen}
        onClose={() => setIsOcppModalOpen(false)}
        entity={selectedCharger || selectedStation}
        entityType={selectedCharger ? "charger" : "station"}
      />
    </div>
  );
};

export default AdminStations;
