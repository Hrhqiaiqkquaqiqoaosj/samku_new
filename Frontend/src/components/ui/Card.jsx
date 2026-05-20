import { useTheme } from '../../contexts/ThemeContext';

const Card = ({
  children,
  title,
  description,
  action,
  className = '',
  variant = 'default'
}) => {
  const { theme } = useTheme();
  
  // Card variant styles
  const variantStyles = {
    default: 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700',
    elevated: 'bg-white dark:bg-slate-800 shadow-md',
    outline: 'border border-slate-200 dark:border-slate-700 bg-transparent'
  };

  return (
    <div className={`rounded-lg overflow-hidden ${variantStyles[variant]} ${className}`}>
      {(title || description || action) && (
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <div>
            {title && <h3 className="text-lg font-medium text-slate-800 dark:text-white">{title}</h3>}
            {description && <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
};

export default Card;