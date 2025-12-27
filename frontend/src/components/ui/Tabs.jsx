export function Tabs({ tabs, activeTab, onChange, className = '' }) {
  return (
    <div className={`border-b border-gray-200 ${className}`}>
      <nav className="flex gap-4" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`
              py-3 px-1 border-b-2 font-medium text-sm transition-colors
              ${activeTab === tab.id 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span 
                className={`ml-2 py-0.5 px-2 rounded-full text-xs
                  ${activeTab === tab.id 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-gray-100 text-gray-600'
                  }
                `}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
