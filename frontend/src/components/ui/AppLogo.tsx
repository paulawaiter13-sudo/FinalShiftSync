type AppLogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AppLogoProps {
  size?: AppLogoSize;
  /** Light backdrop for use on dark surfaces (sidebar, login panel) */
  onDark?: boolean;
  className?: string;
}

const heightClasses: Record<AppLogoSize, string> = {
  xs: 'h-7',
  sm: 'h-8',
  md: 'h-10',
  lg: 'h-14',
  xl: 'h-20',
};

export function AppLogo({ size = 'md', onDark = false, className = '' }: AppLogoProps) {
  return (
    <img
      src="/logo.jpg"
      alt="ShiftSync"
      className={`w-auto object-contain ${heightClasses[size]} ${
        onDark ? 'rounded-lg bg-white px-2 py-1 shadow-sm' : ''
      } ${className}`}
    />
  );
}
