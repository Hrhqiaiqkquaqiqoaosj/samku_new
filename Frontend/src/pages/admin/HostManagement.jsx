import { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { PlusCircle, Edit, Trash2, Search } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';

const AdminHostManagement = () => {
  const { hosts, addHost, updateHost, deleteHost } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedHost, setSelectedHost] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    contactEmail: '',
    countryCode: '+91',
    phoneNumber: '',
    address: {
      streetLine1: '',
      streetLine2: '',
      state: '',
      city: '',
      country: 'India',
      postalCode: ''
    },
    clientHostBillable: true
  });

  // Filter hosts based on search query
  const filteredHosts = hosts.filter(host => {
    return host.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           host.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
           host.contactEmail.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Handle input change for add/edit form
  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: e.target.checked }));
    } else if (name.includes('.')) {
      // Handle nested address fields
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Open add modal
  const handleAddClick = () => {
    setFormData({
      name: '',
      contactPerson: '',
      contactEmail: '',
      countryCode: '+91',
      phoneNumber: '',
      address: {
        streetLine1: '',
        streetLine2: '',
        state: '',
        city: '',
        country: 'India',
        postalCode: ''
      },
      clientHostBillable: true
    });
    setIsAddModalOpen(true);
  };

  // Open edit modal
  const handleEditClick = (host) => {
    setSelectedHost(host);
    setFormData({
      name: host.name,
      contactPerson: host.contactPerson,
      contactEmail: host.contactEmail,
      countryCode: host.countryCode,
      phoneNumber: host.phoneNumber,
      address: { ...host.address },
      clientHostBillable: host.clientHostBillable
    });
    setIsEditModalOpen(true);
  };

  // Open delete modal
  const handleDeleteClick = (host) => {
    setSelectedHost(host);
    setIsDeleteModalOpen(true);
  };

  // Handle add host submission
  const handleAddSubmit = () => {
    // Validate form
    if (!formData.name || !formData.contactPerson || !formData.contactEmail || !formData.phoneNumber) {
      alert('Please fill all required fields');
      return;
    }

    // Create new host
    const newHost = {
      ...formData,
      createdAt: new Date().toISOString()
    };

    addHost(newHost);
    setIsAddModalOpen(false);
  };

  // Handle edit host submission
  const handleEditSubmit = () => {
    // Validate form
    if (!formData.name || !formData.contactPerson || !formData.contactEmail || !formData.phoneNumber) {
      alert('Please fill all required fields');
      return;
    }

    updateHost(selectedHost.id, formData);
    setIsEditModalOpen(false);
  };

  // Handle delete host
  const handleDeleteSubmit = () => {
    deleteHost(selectedHost.id);
    setIsDeleteModalOpen(false);
  };

  // Table columns
  const columns = [
    {
      header: 'Name',
      accessor: 'name',
    },
    {
      header: 'Contact Number',
      accessor: (host) => (
        <div>
          <div>{host.countryCode} {host.phoneNumber}</div>
          <div className="text-sm text-gray-500">{host.contactPerson}</div>
          <div className="text-sm text-gray-500">{host.contactEmail}</div>
        </div>
      ),
    },
    {
      header: 'Created At',
      accessor: 'createdAt',
    },
    {
      header: 'Actions',
      accessor: (host) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Edit size={16} />}
            onClick={() => handleEditClick(host)}
          >
            Edit
          </Button>
          <Button
            variant="danger"
            size="sm"
            leftIcon={<Trash2 size={16} />}
            onClick={() => handleDeleteClick(host)}
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
        <h1 className="text-2xl font-bold text-gray-800">Host Management</h1>
        <Button
          variant="primary"
          leftIcon={<PlusCircle size={20} />}
          onClick={handleAddClick}
        >
          Add Host
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
              placeholder="Search by name"
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <Table
          columns={columns}
          data={filteredHosts}
          keyField="id"
        />

        {filteredHosts.length === 0 && (
          <div className="text-center py-8 border-t">
            <p className="text-gray-500">No hosts found matching your search criteria</p>
          </div>
        )}
      </Card>
      
      {/* Add Host Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Host"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAddSubmit}>Add Host</Button>
          </>
        }
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Host Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. Metro Energy"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Contact Person *</label>
            <input
              type="text"
              name="contactPerson"
              value={formData.contactPerson}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. Raj Sharma"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Contact Email *</label>
            <input
              type="email"
              name="contactEmail"
              value={formData.contactEmail}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="name@example.com"
              required
            />
          </div>
          
          <div className="grid grid-cols-5 gap-4">
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700">Country Code *</label>
              <input
                type="text"
                name="countryCode"
                value={formData.countryCode}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="+91"
                required
              />
            </div>
            
            <div className="col-span-4">
              <label className="block text-sm font-medium text-gray-700">Phone Number *</label>
              <input
                type="text"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. 9876543210"
                required
              />
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-4 mt-4">
            <h3 className="text-lg font-medium text-gray-800 mb-2">Address</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Street Line 1 *</label>
              <input
                type="text"
                name="address.streetLine1"
                value={formData.address.streetLine1}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. 123 Main Street"
                required
              />
            </div>
            
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700">Street Line 2</label>
              <input
                type="text"
                name="address.streetLine2"
                value={formData.address.streetLine2}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. Office 456"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">City *</label>
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
                <label className="block text-sm font-medium text-gray-700">State *</label>
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
                <label className="block text-sm font-medium text-gray-700">Country *</label>
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
                <label className="block text-sm font-medium text-gray-700">Postal Code *</label>
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
          </div>
          
          <div className="flex items-center mt-4">
            <input
              type="checkbox"
              id="clientHostBillable"
              name="clientHostBillable"
              checked={formData.clientHostBillable}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="clientHostBillable" className="ml-2 block text-sm text-gray-900">
              Client/Host Billable
            </label>
          </div>
        </div>
      </Modal>
      
      {/* Edit Host Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Host"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleEditSubmit}>Update Host</Button>
          </>
        }
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Host Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. Metro Energy"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Contact Person *</label>
            <input
              type="text"
              name="contactPerson"
              value={formData.contactPerson}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. Raj Sharma"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Contact Email *</label>
            <input
              type="email"
              name="contactEmail"
              value={formData.contactEmail}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="name@example.com"
              required
            />
          </div>
          
          <div className="grid grid-cols-5 gap-4">
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700">Country Code *</label>
              <input
                type="text"
                name="countryCode"
                value={formData.countryCode}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="+91"
                required
              />
            </div>
            
            <div className="col-span-4">
              <label className="block text-sm font-medium text-gray-700">Phone Number *</label>
              <input
                type="text"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. 9876543210"
                required
              />
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-4 mt-4">
            <h3 className="text-lg font-medium text-gray-800 mb-2">Address</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Street Line 1 *</label>
              <input
                type="text"
                name="address.streetLine1"
                value={formData.address.streetLine1}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. 123 Main Street"
                required
              />
            </div>
            
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700">Street Line 2</label>
              <input
                type="text"
                name="address.streetLine2"
                value={formData.address.streetLine2}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. Office 456"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">City *</label>
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
                <label className="block text-sm font-medium text-gray-700">State *</label>
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
                <label className="block text-sm font-medium text-gray-700">Country *</label>
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
                <label className="block text-sm font-medium text-gray-700">Postal Code *</label>
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
          </div>
          
          <div className="flex items-center mt-4">
            <input
              type="checkbox"
              id="editClientHostBillable"
              name="clientHostBillable"
              checked={formData.clientHostBillable}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="editClientHostBillable" className="ml-2 block text-sm text-gray-900">
              Client/Host Billable
            </label>
          </div>
        </div>
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Host"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDeleteSubmit}>Delete</Button>
          </>
        }
      >
        <p>Are you sure you want to delete the host "{selectedHost?.name}"?</p>
        <p className="text-sm text-red-500 mt-2">This action cannot be undone and will also delete all associated stations and chargers.</p>
      </Modal>
    </div>
  );
};

export default AdminHostManagement;