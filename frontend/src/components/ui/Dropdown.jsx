import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export function Dropdown({ 
  trigger, 
  children,
  items,
  align = 'left',
  className = '' 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const alignments = {
    left: 'left-0',
    right: 'right-0',
    center: 'left-1/2 -translate-x-1/2',
  };

  const handleItemClick = (onClick) => {
    setIsOpen(false);
    if (onClick) onClick();
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>
      
      {isOpen && (
        <div 
          className={`absolute z-50 mt-2 w-56 rounded-lg bg-white shadow-lg ring-1 ring-black/5 ${alignments[align]}`}
        >
          <div className="py-1">
            {items ? (
              items.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleItemClick(item.onClick)}
                  className={`
                    w-full flex items-center px-4 py-2 text-sm text-left
                    hover:bg-gray-50
                    ${item.className || 'text-gray-700'}
                  `}
                >
                  {item.icon && <item.icon className="w-4 h-4 mr-3" />}
                  {item.label}
                </button>
              ))
            ) : (
              <div onClick={() => setIsOpen(false)}>
                {children}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function DropdownItem({ 
  children, 
  onClick, 
  icon: Icon, 
  danger = false,
  className = '' 
}) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center px-4 py-2 text-sm text-left
        ${danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50'}
        ${className}
      `}
    >
      {Icon && <Icon className="w-4 h-4 mr-3" />}
      {children}
    </button>
  );
}

export function DropdownDivider() {
  return <div className="my-1 border-t border-gray-100" />;
}
