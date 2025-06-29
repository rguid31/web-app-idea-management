import Icon from './Icon';

// Linear Progress Bar
export const LinearProgress = ({ 
  value = 0, 
  max = 100, 
  size = 'md', 
  variant = 'primary',
  showLabel = false,
  className = '' 
}) => {
  const percentage = Math.round((value / max) * 100);
  
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2', 
    lg: 'h-3'
  };

  const variantClasses = {
    primary: 'bg-blue-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500'
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between text-sm text-gray-400 mb-1">
          <span>Progress</span>
          <span>{percentage}%</span>
        </div>
      )}
      <div className={`w-full bg-gray-700 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div 
          className={`${variantClasses[variant]} ${sizeClasses[size]} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// Circular Progress
export const CircularProgress = ({ 
  value = 0, 
  max = 100, 
  size = 'md',
  variant = 'primary',
  showLabel = false,
  className = '' 
}) => {
  const percentage = (value / max) * 100;
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const variantClasses = {
    primary: 'text-blue-500',
    success: 'text-green-500', 
    warning: 'text-yellow-500',
    error: 'text-red-500'
  };

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          className="text-gray-700"
        />
        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`transition-all duration-300 ease-out ${variantClasses[variant]}`}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-gray-300">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  );
};

// Loading Spinner
export const LoadingSpinner = ({ 
  size = 'md',
  variant = 'primary',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const variantClasses = {
    primary: 'text-blue-500',
    success: 'text-green-500',
    warning: 'text-yellow-500', 
    error: 'text-red-500',
    light: 'text-white',
    dark: 'text-gray-900'
  };

  return (
    <Icon 
      name="loading" 
      size={size}
      className={`${variantClasses[variant]} ${className}`}
    />
  );
};

// Skeleton Loader
export const Skeleton = ({ 
  variant = 'rectangular',
  width = '100%',
  height = '1rem',
  className = ''
}) => {
  const variantClasses = {
    text: 'rounded',
    rectangular: 'rounded',
    circular: 'rounded-full'
  };

  return (
    <div 
      className={`bg-gray-700 animate-pulse ${variantClasses[variant]} ${className}`}
      style={{ width, height }}
    />
  );
};

// Pulse Loading
export const PulseLoader = ({ 
  count = 3,
  size = 'md',
  variant = 'primary',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const variantClasses = {
    primary: 'bg-blue-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500'
  };

  return (
    <div className={`flex space-x-1 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${sizeClasses[size]} ${variantClasses[variant]} rounded-full animate-pulse`}
          style={{
            animationDelay: `${i * 0.15}s`,
            animationDuration: '0.6s'
          }}
        />
      ))}
    </div>
  );
};

// Progress Steps
export const ProgressSteps = ({ 
  steps,
  currentStep = 0,
  variant = 'primary',
  className = ''
}) => {
  const variantClasses = {
    primary: {
      active: 'bg-blue-500 border-blue-500 text-white',
      completed: 'bg-green-500 border-green-500 text-white',
      pending: 'bg-gray-700 border-gray-600 text-gray-400'
    },
    success: {
      active: 'bg-green-500 border-green-500 text-white',
      completed: 'bg-green-600 border-green-600 text-white',
      pending: 'bg-gray-700 border-gray-600 text-gray-400'
    }
  };

  const getStepStatus = (index) => {
    if (index < currentStep) return 'completed';
    if (index === currentStep) return 'active';
    return 'pending';
  };

  return (
    <div className={`flex items-center ${className}`}>
      {steps.map((step, index) => {
        const status = getStepStatus(index);
        const isLast = index === steps.length - 1;
        
        return (
          <div key={index} className="flex items-center">
            <div className="flex items-center">
              <div 
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-colors ${variantClasses[variant][status]}`}
              >
                {status === 'completed' ? (
                  <Icon name="check" size="sm" />
                ) : (
                  index + 1
                )}
              </div>
              {step.label && (
                <span className={`ml-2 text-sm ${status === 'pending' ? 'text-gray-500' : 'text-gray-300'}`}>
                  {step.label}
                </span>
              )}
            </div>
            {!isLast && (
              <div className={`w-12 h-0.5 mx-2 ${status === 'completed' ? 'bg-green-500' : 'bg-gray-600'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};