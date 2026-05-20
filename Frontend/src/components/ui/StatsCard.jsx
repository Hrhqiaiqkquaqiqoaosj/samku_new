import { useTheme } from '../../contexts/ThemeContext';

const StatsCard = ({ 
  title, 
  value, 
  icon, 
  color = 'blue',
  footer
}) => {
  const { theme } = useTheme();
  
  // Define color variants
  const colorClasses = {
    blue: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-600 dark:text-blue-400',
    },
    green: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-600 dark:text-green-400',
    },
    red: {
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-600 dark:text-red-400',
    },
    yellow: {
      bg: 'bg-yellow-100 dark:bg-yellow-900/30',
      text: 'text-yellow-600 dark:text-yellow-400',
    },
    purple: {
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      text: 'text-purple-600 dark:text-purple-400',
    },
    indigo: {
      bg: 'bg-indigo-100 dark:bg-indigo-900/30',
      text: 'text-indigo-600 dark:text-indigo-400',
    },
    orange: {
      bg: 'bg-orange-100 dark:bg-orange-900/30',
      text: 'text-orange-600 dark:text-orange-400',
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
      <div className="flex items-start">
        <div className={`p-3 rounded-lg ${colorClasses[color].bg} ${colorClasses[color].text} mr-4`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">{value}</h3>
          {footer && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {footer}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatsCard;