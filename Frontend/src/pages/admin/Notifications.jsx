import { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { Search, Bell } from 'lucide-react';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';

const AdminNotifications = () => {
  const { notifications = [] } = useData();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter notifications based on search query
  const filteredNotifications = notifications.filter(notification => {
    return notification.message.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Table columns
  const columns = [
    {
      header: 'Time',
      accessor: 'timestamp',
    },
    {
      header: 'Message',
      accessor: 'message',
    },
    {
      header: 'Severity',
      accessor: (notification) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          notification.severity === 'high' ? 'bg-red-100 text-red-800' :
          notification.severity === 'medium' ? 'bg-orange-100 text-orange-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {notification.severity.charAt(0).toUpperCase() + notification.severity.slice(1)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
      </div>
      
      <Card>
        <div className="mb-4 flex items-center">
          <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search notifications"
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <Table
          columns={columns}
          data={filteredNotifications}
          keyField="id"
        />

        {filteredNotifications.length === 0 && (
          <div className="text-center py-8 border-t">
            <Bell size={48} className="mx-auto text-gray-400" />
            <p className="text-gray-500 mt-2">No notifications found</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminNotifications;