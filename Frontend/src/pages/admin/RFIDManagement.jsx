import { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { PlusCircle, Edit, Trash2, Search, Check, X } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';

const AdminRFIDManagement = () => {
  const { rfidCards, customers, addRFIDCard, updateRFIDCard, deleteRFIDCard } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [formData, setFormData] = useState({
    rfid: '',
    customerName: '',
    customerEmail: '',
    status: 'ACTIVE',
    isGlobal: true,
    description: '',
    customerId: ''
  });

  // Filter RFID cards based on search query
  const filteredCards = rfidCards.filter(card => {
    return card.rfid.toLowerCase().includes(searchQuery.toLowerCase()) ||
           card.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           card.customerEmail.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Handle input change for add/edit form
  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: e.target.checked }));
    } else if (name === 'customerId' && value) {
      // When customer is selected, auto-fill name and email
      const selectedCustomer = customers.find(c => c.id === value);
      if (selectedCustomer) {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          customerName: selectedCustomer.name,
          customerEmail: selectedCustomer.email
        }));
      } else {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Open add modal
  const handleAddClick = () => {
    setFormData({
      rfid: '',
      customerName: '',
      customerEmail: '',
      status: 'ACTIVE',
      isGlobal: true,
      description: '',
      customerId: ''
    });
    setIsAddModalOpen(true);
  };

  // Open edit modal
  const handleEditClick = (card) => {
    setSelectedCard(card);
    setFormData({
      rfid: card.rfid,
      customerName: card.customerName,
      customerEmail: card.customerEmail,
      status: card.status,
      isGlobal: card.isGlobal,
      description: card.description,
      customerId: card.customerId
    });
    setIsEditModalOpen(true);
  };

  // Open delete modal
  const handleDeleteClick = (card) => {
    setSelectedCard(card);
    setIsDeleteModalOpen(true);
  };

  // Handle add card submission
  const handleAddSubmit = () => {
    // Validate form
    if (!formData.rfid || !formData.customerName || !formData.customerEmail || !formData.customerId) {
      alert('Please fill all required fields');
      return;
    }

    // Create new card
    const newCard = { ...formData };
    addRFIDCard(newCard);
    setIsAddModalOpen(false);
  };

  // Handle edit card submission
  const handleEditSubmit = () => {
    // Validate form
    if (!formData.rfid || !formData.customerName || !formData.customerEmail || !formData.customerId) {
      alert('Please fill all required fields');
      return;
    }

    updateRFIDCard(selectedCard.id, formData);
    setIsEditModalOpen(false);
  };

  // Handle delete card
  const handleDeleteSubmit = () => {
    deleteRFIDCard(selectedCard.id);
    setIsDeleteModalOpen(false);
  };

  // Table columns
  const columns = [
    {
      header: 'RFID',
      accessor: 'rfid',
    },
    {
      header: 'Customer Name',
      accessor: 'customerName',
    },
    {
      header: 'Customer Email',
      accessor: 'customerEmail',
    },
    {
      header: 'Status',
      accessor: (card) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          card.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {card.status}
        </span>
      ),
    },
    {
      header: 'Global',
      accessor: (card) => (
        card.isGlobal ? 
          <Check size={18} className="text-green-500" /> : 
          <X size={18} className="text-red-500" />
      ),
    },
    {
      header: 'Description',
      accessor: 'description',
    },
    {
      header: 'Actions',
      accessor: (card) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Edit size={16} />}
            onClick={() => handleEditClick(card)}
          >
            Edit
          </Button>
          <Button
            variant="danger"
            size="sm"
            leftIcon={<Trash2 size={16} />}
            onClick={() => handleDeleteClick(card)}
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
        <h1 className="text-2xl font-bold text-gray-800">RFID Management</h1>
        <Button
          variant="primary"
          gradient
          leftIcon={<PlusCircle size={20} />}
          onClick={handleAddClick}
        >
          Add RFID Card
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
              placeholder="Search by RFID or customer name"
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <Table
          columns={columns}
          data={filteredCards}
          keyField="id"
        />

        {filteredCards.length === 0 && (
          <div className="text-center py-8 border-t">
            <p className="text-gray-500">No RFID cards found matching your search criteria</p>
          </div>
        )}
      </Card>
      
      {/* Add RFID Card Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New RFID Card"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button variant="primary" gradient onClick={handleAddSubmit}>Add RFID Card</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">RFID *</label>
            <input
              type="text"
              name="rfid"
              value={formData.rfid}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="RFID-YYYY-XXX"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Customer *</label>
            <select
              name="customerId"
              value={formData.customerId}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select a Customer</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} ({customer.email})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Status *</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Card description or notes"
            />
          </div>
          
          <div className="flex items-center mt-4">
            <input
              type="checkbox"
              id="isGlobal"
              name="isGlobal"
              checked={formData.isGlobal}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isGlobal" className="ml-2 block text-sm text-gray-900">
              Global (can be used at any station)
            </label>
          </div>
        </div>
      </Modal>
      
      {/* Edit RFID Card Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit RFID Card"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button variant="primary" gradient onClick={handleEditSubmit}>Update RFID Card</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">RFID *</label>
            <input
              type="text"
              name="rfid"
              value={formData.rfid}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="RFID-YYYY-XXX"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Customer *</label>
            <select
              name="customerId"
              value={formData.customerId}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select a Customer</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} ({customer.email})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Status *</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Card description or notes"
            />
          </div>
          
          <div className="flex items-center mt-4">
            <input
              type="checkbox"
              id="editIsGlobal"
              name="isGlobal"
              checked={formData.isGlobal}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="editIsGlobal" className="ml-2 block text-sm text-gray-900">
              Global (can be used at any station)
            </label>
          </div>
        </div>
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete RFID Card"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDeleteSubmit}>Delete</Button>
          </>
        }
      >
        <p>Are you sure you want to delete the RFID card "{selectedCard?.rfid}"?</p>
        <p className="text-gray-600 mt-1">Assigned to: {selectedCard?.customerName}</p>
        <p className="text-sm text-red-500 mt-2">This action cannot be undone.</p>
      </Modal>
    </div>
  );
};

export default AdminRFIDManagement;