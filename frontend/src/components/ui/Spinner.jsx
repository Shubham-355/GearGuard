export function Spinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  return (
    <div className={`${sizes[size]} ${className}`}>
      <svg 
        className="animate-spin text-blue-600" 
        fill="none" 
        viewBox="0 0 24 24"
      >
        <circle 
          className="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="4" 
        />
        <path 
          className="opacity-75" 
          fill="currentColor" 
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
        />
      </svg>
    </div>
  );
}

export function LoadingScreen({ message = 'Loading...' }) {
  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
      <div className="text-center">
        <Spinner size="lg" className="mx-auto mb-4" />
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
}

export function LoadingOverlay({ message = 'Loading...' }) {
  return (
    <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded-lg">
      <div className="text-center">
        <Spinner size="md" className="mx-auto mb-2" />
        <p className="text-gray-600 text-sm">{message}</p>
      </div>
    </div>
  );
}
