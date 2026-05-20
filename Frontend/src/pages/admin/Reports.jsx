import { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { BarChart2, Download, Calendar, Filter } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const AdminReports = () => {
  const { stations, transactions } = useData();
  const [reportType, setReportType] = useState('monthly');
  const [stationFilter, setStationFilter] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  // Handle date range changes
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Function to generate and download report
  const handleGenerateReport = () => {
    // In a real app, this would call an API to generate a report
    alert(`Report generated for ${reportType} data. In a real application, this would download a PDF or Excel file.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
        <Button
          variant="primary"
          leftIcon={<Download size={20} />}
          onClick={handleGenerateReport}
        >
          Generate Report
        </Button>
      </div>
      
      <Card>
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Report Type Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter size={16} className="text-gray-400" />
              </div>
              <select
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
                <option value="daily">Daily Report</option>
                <option value="weekly">Weekly Report</option>
                <option value="monthly">Monthly Report</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
          </div>
          
          {/* Station Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Station</label>
            <select
              className="px-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={stationFilter}
              onChange={(e) => setStationFilter(e.target.value)}
            >
              <option value="">All Stations</option>
              {stations.map(station => (
                <option key={station.id} value={station.id}>
                  {station.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Date Range (only shown for custom report type) */}
          {reportType === 'custom' && (
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="date"
                    name="startDate"
                    value={dateRange.startDate}
                    onChange={handleDateChange}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="date"
                    name="endDate"
                    value={dateRange.endDate}
                    onChange={handleDateChange}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="border-t pt-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <BarChart2 size={64} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-800">Report Preview</h3>
              <p className="text-gray-500">Select report parameters and click "Generate Report" to download</p>
            </div>
          </div>
        </div>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Available Reports">
          <ul className="divide-y">
            <li className="py-3 flex justify-between items-center">
              <div>
                <h3 className="font-medium">Monthly Revenue Report</h3>
                <p className="text-sm text-gray-500">April 2025</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Download size={16} />}
              >
                Download
              </Button>
            </li>
            <li className="py-3 flex justify-between items-center">
              <div>
                <h3 className="font-medium">Quarterly Performance</h3>
                <p className="text-sm text-gray-500">Q1 2025</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Download size={16} />}
              >
                Download
              </Button>
            </li>
            <li className="py-3 flex justify-between items-center">
              <div>
                <h3 className="font-medium">Station Utilization</h3>
                <p className="text-sm text-gray-500">Last 30 days</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Download size={16} />}
              >
                Download
              </Button>
            </li>
          </ul>
        </Card>
        
        <Card title="Report Settings">
          <div className="space-y-4">
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  defaultChecked
                />
                <span className="ml-2 text-sm text-gray-700">Include transaction details</span>
              </label>
            </div>
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  defaultChecked
                />
                <span className="ml-2 text-sm text-gray-700">Include financial summary</span>
              </label>
            </div>
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  defaultChecked
                />
                <span className="ml-2 text-sm text-gray-700">Include graphs and charts</span>
              </label>
            </div>
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Include customer details</span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Report Format</label>
              <select
                className="px-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                defaultValue="pdf"
              >
                <option value="pdf">PDF Document</option>
                <option value="excel">Excel Spreadsheet</option>
                <option value="csv">CSV File</option>
              </select>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminReports;