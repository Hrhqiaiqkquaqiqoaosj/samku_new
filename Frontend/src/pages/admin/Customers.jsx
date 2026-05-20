import { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { Search, Mail, Phone, CheckCircle, XCircle, User } from 'lucide-react';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';

const AdminCustomers = () => {
  const { customers, loading } = useData();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter customers based on search query
  const filteredCustomers = customers.filter(customer => {
    const searchTerm = searchQuery.toLowerCase();
    return customer.name?.toLowerCase().includes(searchTerm) ||
           customer.email?.toLowerCase().includes(searchTerm) ||
           customer.phoneNumber?.includes(searchQuery) ||
           customer.username?.toLowerCase().includes(searchTerm);
  });

  // Table columns
  const columns = [
    {
      header: 'Name',
      accessor: 'name',
    },
    {
      header: 'Username',
      accessor: 'username',
    },
    {
      header: 'Email',
      accessor: 'email',
    },
    {
      header: 'Phone Number',
      accessor: 'phoneNumber',
    },
    {
      header: 'Type',
      accessor: (customer) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          customer.type === 'EMAIL' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
        }`}>
          {customer.type === 'EMAIL' ? (
            <span className="flex items-center">
              <Mail size={12} className="mr-1" />
              {customer.type}
            </span>
          ) : (
            <span className="flex items-center">
              <Phone size={12} className="mr-1" />
              {customer.type}
            </span>
          )}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (customer) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${
          customer.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {customer.isActive ? (
            <>
              <CheckCircle size={12} className="mr-1" />
              Active
            </>
          ) : (
            <>
              <XCircle size={12} className="mr-1" />
              Inactive
            </>
          )}
        </span>
      ),
    },
    {
      header: 'Verified',
      accessor: (customer) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          customer.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {customer.isVerified ? 'Verified' : 'Pending'}
        </span>
      ),
    },
    {
      header: 'Created At',
      accessor: 'createdAt',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Customers</h1>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <User size={16} />
          <span>Users with USER role</span>
        </div>
      </div>
      
      <Card>
        <div className="mb-4 flex items-center">
          <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name, email, phone or username"
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        {loading.customers ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-600">Loading customers...</p>
          </div>
        ) : (
          <>
            <Table
              columns={columns}
              data={filteredCustomers}
              keyField="id"
            />

            {filteredCustomers.length === 0 && !loading.customers && (
              <div className="text-center py-8 border-t">
                <p className="text-gray-500">
                  {customers.length === 0 
                    ? "No customers found. Users with role 'USER' will appear here." 
                    : "No customers found matching your search criteria"
                  }
                </p>
              </div>
            )}
          </>
        )}
      </Card>
      
      {/* Customer Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="text-center p-4">
            <div className="text-4xl font-bold text-blue-500">{customers.length}</div>
            <div className="text-gray-600 mt-2">Total Customers</div>
          </div>
        </Card>
        
        <Card>
          <div className="text-center p-4">
            <div className="text-4xl font-bold text-green-500">
              {customers.filter(c => c.isActive).length}
            </div>
            <div className="text-gray-600 mt-2">Active Customers</div>
          </div>
        </Card>
        
        <Card>
          <div className="text-center p-4">
            <div className="text-4xl font-bold text-purple-500">
              {customers.filter(c => c.isVerified).length}
            </div>
            <div className="text-gray-600 mt-2">Verified Customers</div>
          </div>
        </Card>
        
        <Card>
          <div className="text-center p-4">
            <div className="text-4xl font-bold text-orange-500">
              {customers.filter(c => c.type === 'EMAIL').length}
            </div>
            <div className="text-gray-600 mt-2">Email Registrations</div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminCustomers;