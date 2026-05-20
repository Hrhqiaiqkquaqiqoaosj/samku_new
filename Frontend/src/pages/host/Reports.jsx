import { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { BarChart2, Download } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const HostReports = () => {
  const { transactions } = useData();
  const [selectedReport, setSelectedReport] = useState('monthly');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  // Available months for selection
  const months = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  // Available years for selection (last 3 years)
  const currentYear = new Date().getFullYear();
  const years = [
    currentYear.toString(),
    (currentYear - 1).toString(),
    (currentYear - 2).toString()
  ];

  // Mock report data
  const revenueData = [
    { name: 'May 01', value: 4000 },
    { name: 'May 05', value: 3000 },
    { name: 'May 10', value: 5000 },
    { name: 'May 15', value: 2780 },
    { name: 'May 20', value: 1890 },
    { name: 'May 25', value: 3390 },
    { name: 'May 30', value: 4490 }
  ];

  // Handle report download
  const handleDownloadReport = () => {
    alert('Report download function would be implemented here');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
      </div>
      
      <Card>
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Report Type</h2>
          <div className="flex flex-wrap gap-2">
            <button
              className={`px-4 py-2 rounded-lg ${selectedReport === 'daily' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}
              onClick={() => setSelectedReport('daily')}
            >
              Daily
            </button>
            <button
              className={`px-4 py-2 rounded-lg ${selectedReport === 'weekly' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}
              onClick={() => setSelectedReport('weekly')}
            >
              Weekly
            </button>
            <button
              className={`px-4 py-2 rounded-lg ${selectedReport === 'monthly' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}
              onClick={() => setSelectedReport('monthly')}
            >
              Monthly
            </button>
            <button
              className={`px-4 py-2 rounded-lg ${selectedReport === 'yearly' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}
              onClick={() => setSelectedReport('yearly')}
            >
              Yearly
            </button>
          </div>
        </div>
        
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Select Period</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(selectedReport === 'monthly' || selectedReport === 'daily') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a Month</option>
                  {months.map(month => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {years.map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Report Preview</h2>
            <Button
              variant="primary"
              leftIcon={<Download size={18} />}
              onClick={handleDownloadReport}
            >
              Download Report
            </Button>
          </div>
          
          {/* Report preview area */}
          <div className="bg-white p-6 border border-gray-200 rounded-lg">
            <div className="flex justify-center items-center h-64">
              {selectedMonth || selectedReport === 'yearly' ? (
                <div className="w-full">
                  <h3 className="text-center text-lg font-medium mb-6">
                    {selectedMonth && months.find(m => m.value === selectedMonth)?.label} {selectedYear} Revenue Chart
                  </h3>
                  
                  {/* Chart would be rendered here, using a mock visual for now */}
                  <div className="h-40 flex items-end justify-between px-4">
                    {revenueData.map((item, index) => (
                      <div key={index} className="flex flex-col items-center">
                        <div 
                          className="w-10 bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-md"
                          style={{ height: `${(item.value / 5000) * 100}%` }}
                        ></div>
                        <span className="text-xs mt-1">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <BarChart2 size={48} className="mx-auto mb-2" />
                  <p>Please select a month to generate the report preview</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-4">Report Summary</h2>
          {selectedMonth || selectedReport === 'yearly' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
                <p className="text-2xl font-bold text-blue-600">₹24,550</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <h3 className="text-sm font-medium text-gray-500">Total Sessions</h3>
                <p className="text-2xl font-bold text-green-600">148</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                <h3 className="text-sm font-medium text-gray-500">Total Energy Consumed</h3>
                <p className="text-2xl font-bold text-purple-600">428.5 kWh</p>
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-4">Please select a month to see the report summary</p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default HostReports;