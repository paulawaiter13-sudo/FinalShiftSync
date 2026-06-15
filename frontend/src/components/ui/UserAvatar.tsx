interface UserAvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-7 w-7 text-[10px]',
  md: 'h-8 w-8 text-xs',
  lg: 'h-10 w-10 text-sm',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

const colors = [
  'bg-blue-600',
  'bg-emerald-600',
  'bg-violet-600',
  'bg-orange-600',
  'bg-rose-600',
  'bg-cyan-600',
];

function colorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function UserAvatar({ name, size = 'md', className = '' }: UserAvatarProps) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${sizeClasses[size]} ${colorForName(name)} ${className}`}
      title={name}
      aria-label={name}
    >
      {getInitials(name)}
    </div>
  );
}
