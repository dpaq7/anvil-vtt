import type { ImgHTMLAttributes } from 'react';

const ANVIL_MENU_ICON = '/landing/anvil-vtt-menu-icon.png';

export interface AnvilIconProps extends ImgHTMLAttributes<HTMLImageElement> {
  size?: number;
}

export function AnvilIcon({
  size = 24,
  alt = '',
  src = ANVIL_MENU_ICON,
  className,
  ...props
}: AnvilIconProps) {
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={['block shrink-0 object-contain', className].filter(Boolean).join(' ')}
      draggable={false}
      {...props}
    />
  );
}
