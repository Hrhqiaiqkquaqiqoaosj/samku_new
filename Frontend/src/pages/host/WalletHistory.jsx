import { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { Search, Calendar } from 'lucide-react';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';

const HostWalletHistory = () => {
  const { walletHistory } = useData();
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  // Filter wallet transactions based on status and date
  const filteredTransactions = walletHistory.filter(transaction => {
    const matchesStatus = statusFilter
      ? transaction.type === statusFilter
      : true;

    const matchesDate = selectedDate
      ? transaction.date.includes(selectedDate)
      : true;

    return matchesStatus && matchesDate;
  });

  // Table columns
  const columns = [
    {
      header: 'Date',
      accessor: 'date',
    },
    {
      header: 'Source',
      accessor: 'source',
    },
    {
      header: 'Reason',
      accessor: 'reason',
    },
    {
      header: 'Type',
      accessor: (transaction) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          transaction.type === 'CREDIT' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
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
      header: 'Previous Balance',
      accessor: 'previousBalance',
    },
    {
      header: 'Current Balance',
      accessor: 'currentBalance',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Wallet History</h1>
      </div>
      
      <Card>
        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Status Filter */}
          <div>
            <select
              className="px-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="CREDIT">Credit</option>
              <option value="DEBIT">Debit</option>
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
            <p className="text-gray-500">No wallet transactions found matching your search criteria</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default HostWalletHistory;