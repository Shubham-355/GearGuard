export function Avatar({ 
  src, 
  name = '', 
  size = 'md',
  className = '' 
}) {
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getColorFromName = (name) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-cyan-500',
      'bg-indigo-500',
    ];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  if (src) {
    return (
      <img 
        src={src} 
        alt={name}
        className={`${sizes[size]} rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div 
      className={`${sizes[size]} ${getColorFromName(name)} rounded-full flex items-center justify-center text-white font-medium ${className}`}
    >
      {getInitials(name) || '?'}
    </div>
  );
}
