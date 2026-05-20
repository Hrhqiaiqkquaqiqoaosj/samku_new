import { forwardRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const Button = forwardRef(({
  children, 
  className = '', 
  variant = 'primary', 
  size = 'md',
  isLoading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  ...props 
}, ref) => {
  const { theme } = useTheme();
  
  const baseStyles = "inline-flex items-center justify-center font-medium transition-colors rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variantStyles = {
    primary: "bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500",
    secondary: "bg-slate-200 text-slate-800 hover:bg-slate-300 focus:ring-slate-500 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600",
    danger: "bg-danger-600 text-white hover:bg-danger-700 focus:ring-danger-500",
    success: "bg-success-600 text-white hover:bg-success-700 focus:ring-success-500",
    warning: "bg-warning-600 text-white hover:bg-warning-700 focus:ring-warning-500",
    ghost: "bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-500 dark:text-slate-300 dark:hover:bg-slate-800",
    outline: "bg-transparent border border-slate-300 text-slate-700 hover:bg-slate-50 focus:ring-slate-500 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800",
  };
  
  const sizeStyles = {
    sm: "text-xs px-2.5 py-1.5",
    md: "text-sm px-4 py-2",
    lg: "text-base px-5 py-2.5",
    xl: "text-lg px-6 py-3",
  };
  
  const disabledStyles = "opacity-50 cursor-not-allowed pointer-events-none";
  const loadingStyles = "opacity-90 cursor-wait pointer-events-none";
  const fullWidthStyles = "w-full";
  
  let combinedClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]}`;
  if (isLoading) combinedClassName += ` ${loadingStyles}`;
  if (disabled) combinedClassName += ` ${disabledStyles}`;
  if (fullWidth) combinedClassName += ` ${fullWidthStyles}`;
  if (className) combinedClassName += ` ${className}`;
  
  return (
    <button
      ref={ref}
      className={combinedClassName}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="w-4 h-4 mr-2 animate-spin" viewBox="0 0 24 24">
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
            fill="none"
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      
      {!isLoading && leftIcon && (
        <span className="mr-2">{leftIcon}</span>
      )}
      
      {children}
      
      {!isLoading && rightIcon && (
        <span className="ml-2">{rightIcon}</span>
      )}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;