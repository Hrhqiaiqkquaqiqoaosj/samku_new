import { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { Search, Calendar, Filter } from 'lucide-react';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';

const HostChargingHistory = () => {
  const { transactions, customers } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchBy, setSearchBy] = useState('transactionId');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // Filter transactions based on search query, status, and date
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = searchBy === 'transactionId' 
      ? transaction.transactionId.toLowerCase().includes(searchQuery.toLowerCase())
      : searchBy === 'serialNumber'
        ? transaction.serialNumber.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
    
    const matchesStatus = statusFilter 
      ? transaction.status === statusFilter 
      : true;
    
    const matchesDate = selectedDate
      ? transaction.date.includes(selectedDate)
      : true;

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Function to open transaction details modal
  const handleViewDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setIsDetailsModalOpen(true);
  };

  // Get customer by ID
  const getCustomerById = (id) => {
    return customers.find(customer => customer.id === id) || null;
  };

  // Table columns
  const columns = [
    {
      header: 'Date',
      accessor: 'date',
    },
    {
      header: 'Serial Number',
      accessor: 'serialNumber',
    },
    {
      header: 'Transaction ID',
      accessor: (transaction) => (
        <button
          onClick={() => handleViewDetails(transaction)}
          className="text-blue-500 hover:underline"
        >
          {transaction.transactionId}
        </button>
      ),
    },
    {
      header: 'Requested Watts',
      accessor: 'requestedWatts',
    },
    {
      header: 'Consumed Watts',
      accessor: 'consumedWatts',
    },
    {
      header: 'Type',
      accessor: (transaction) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          transaction.type === 'APP' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
        }`}>
          {transaction.type}
        </span>
      ),
    },
    {
      header: 'Amount',
      accessor: 'amount',
    },
    {
      header: 'Status',
      accessor: (transaction) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          transaction.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 
          transaction.status === 'FAILED' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {transaction.status}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Charging History</h1>
      </div>
      
      <Card>
        <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search by Transaction ID */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder={`Search by ${searchBy === 'transactionId' ? 'Transaction ID' : 'Serial Number'}`}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* Search By Selector */}
          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter size={16} className="text-gray-400" />
              </div>
              <select
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchBy}
                onChange={(e) => setSearchBy(e.target.value)}
              >
                <option value="transactionId">Transaction ID</option>
                <option value="serialNumber">Serial Number</option>
              </select>
            </div>
          </div>
          
          {/* Status Filter */}
          <div>
            <select
              className="px-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
              <option value="IN_PROGRESS">In Progress</option>
            </select>
          </div>
          
          {/* Date Picker */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar size={16} className="text-gray-400" />
            </div>
            <input
              type="date"
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>
        
        <Table
          columns={columns}
          data={filteredTransactions}
          keyField="id"
        />

        {filteredTransactions.length === 0 && (
          <div className="text-center py-8 border-t">
            <p className="text-gray-500">No transactions found matching your search criteria</p>
          </div>
        )}
      </Card>
      
      {/* Transaction Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title="Transaction Details"
        footer={
          <Button variant="outline" onClick={() => setIsDetailsModalOpen(false)}>Close</Button>
        }
      >
        {selectedTransaction && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Transaction ID</h3>
                <p className="text-base font-medium">{selectedTransaction.transactionId}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Date</h3>
                <p className="text-base font-medium">{selectedTransaction.date}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Serial Number</h3>
                <p className="text-base font-medium">{selectedTransaction.serialNumber}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Type</h3>
                <p className="text-base">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    selectedTransaction.type === 'APP' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                  }`}>
                    {selectedTransaction.type}
                  </span>
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Requested Watts</h3>
                <p className="text-base font-medium">{selectedTransaction.requestedWatts}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Consumed Watts</h3>
                <p className="text-base font-medium">{selectedTransaction.consumedWatts}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Amount</h3>
                <p className="text-base font-medium">{selectedTransaction.amount}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                <p className="text-base">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    selectedTransaction.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 
                    selectedTransaction.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {selectedTransaction.status}
                  </span>
                </p>
              </div>
            </div>
            
            {selectedTransaction.faultReason && (
              <div className="pt-2 border-t">
                <h3 className="text-sm font-medium text-gray-500">Fault Reason</h3>
                <p className="text-base text-red-500">{selectedTransaction.faultReason}</p>
              </div>
            )}
            
            <div className="pt-2 border-t">
              <h3 className="text-sm font-medium text-gray-500">Customer</h3>
              {selectedTransaction.customerId && getCustomerById(selectedTransaction.customerId) ? (
                <div className="mt-1">
                  <p className="font-medium">{getCustomerById(selectedTransaction.customerId)?.name}</p>
                  <p className="text-sm text-gray-500">{getCustomerById(selectedTransaction.customerId)?.email}</p>
                  <p className="text-sm text-gray-500">{getCustomerById(selectedTransaction.customerId)?.phoneNumber}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Customer information not available</p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default HostChargingHistory;