import { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const Table = ({
  columns,
  data,
  keyField,
  pageSize = 10,
  className = '',
}) => {
  const { theme } = useTheme();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setTotalPages(Math.ceil(data.length / pageSize));
    // Reset to page 1 if data changes and current page is out of range
    if (currentPage > Math.ceil(data.length / pageSize)) {
      setCurrentPage(1);
    }
  }, [data, pageSize, currentPage]);

  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return data.slice(startIndex, endIndex);
  };

  const renderCell = (item, column) => {
    if (column.cell) {
      return column.cell(item);
    }

    if (typeof column.accessor === 'function') {
      return column.accessor(item);
    }

    return item[column.accessor];
  };

  const maxPageButtons = 5; // Number of page buttons to show
  const getPageButtons = () => {
    const buttons = [];
    const startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
    const endPage = Math.min(totalPages, startPage + maxPageButtons - 1);

    // Previous page button
    buttons.push(
      <button
        key="prev"
        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
        disabled={currentPage === 1}
        className="px-3 py-1 rounded-md border dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-slate-700 dark:text-white"
      >
        «
      </button>
    );

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`px-3 py-1 rounded-md border dark:border-slate-600 ${
            currentPage === i ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white border-transparent' : 'dark:bg-slate-700 dark:text-white'
          }`}
        >
          {i}
        </button>
      );
    }

    // Show ellipsis if there are more pages after
    if (endPage < totalPages) {
      buttons.push(
        <span key="ellipsis" className="px-2 dark:text-white">
          ...
        </span>
      );
      // Show last page if not already visible
      if (endPage !== totalPages) {
        buttons.push(
          <button
            key={totalPages}
            onClick={() => setCurrentPage(totalPages)}
            className="px-3 py-1 rounded-md border dark:border-slate-600 dark:bg-slate-700 dark:text-white"
          >
            {totalPages}
          </button>
        );
      }
    }

    // Next page button
    buttons.push(
      <button
        key="next"
        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
        disabled={currentPage === totalPages}
        className="px-3 py-1 rounded-md border dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-slate-700 dark:text-white"
      >
        »
      </button>
    );

    return buttons;
  };

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full border-collapse bg-white dark:bg-slate-800 rounded-lg shadow-sm">
        <thead>
          <tr className="bg-gray-50 dark:bg-slate-700 border-b dark:border-slate-600">
            {columns.map((column, index) => (
              <th
                key={index}
                className={`px-5 py-3 text-left font-medium text-gray-600 dark:text-gray-200 ${column.className || ''}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {getCurrentPageData().map((item, index) => (
            <tr
              key={item[keyField] !== undefined ? String(item[keyField]) : `row-${index}`}
              className="border-b dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700"
            >
              {columns.map((column, index) => (
                <td
                  key={index}
                  className={`px-5 py-4 dark:text-gray-200 ${column.className || ''}`}
                >
                  {renderCell(item, column)}
                </td>
              ))}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className="px-5 py-4 text-center text-gray-500 dark:text-gray-400"
              >
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="flex justify-center mt-4 space-x-1">
          {getPageButtons()}
        </div>
      )}
    </div>
  );
}

export default Table;