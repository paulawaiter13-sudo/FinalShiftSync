type AppLogoVariant = 'icon' | 'full';
type AppLogoSize = 'xs' | 'sm' | 'md' | 'lg';

interface AppLogoProps {
  /** Icon mark only, or full logo with wordmark */
  variant?: AppLogoVariant;
  size?: AppLogoSize;
  className?: string;
}

const logoSources: Record<AppLogoVariant, Record<AppLogoSize, { src: string; width: number; height: number }>> = {
  icon: {
    xs: { src: '/logo-icon-28.png', width: 31, height: 28 },
    sm: { src: '/logo-icon-32.png', width: 35, height: 32 },
    md: { src: '/logo-icon-36.png', width: 39, height: 36 },
    lg: { src: '/logo-icon-36.png', width: 39, height: 36 },
  },
  full: {
    xs: { src: '/logo-full-48.png', width: 63, height: 48 },
    sm: { src: '/logo-full-48.png', width: 63, height: 48 },
    md: { src: '/logo-full-80.png', width: 105, height: 80 },
    lg: { src: '/logo-full-112.png', width: 147, height: 112 },
  },
};

export function AppLogo({ variant = 'full', size = 'md', className = '' }: AppLogoProps) {
  const logo = logoSources[variant][size];

  return (
    <img
      src={logo.src}
      alt="ShiftSync"
      width={logo.width}
      height={logo.height}
      className={`block shrink-0 object-contain ${className}`}
      decoding="async"
    />
  );
}
