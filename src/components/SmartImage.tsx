import { forwardRef } from 'react';

type Props = Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src: string;
  enabled?: boolean;
};

/**
 * Compatibility wrapper around `<img>` — kept since other parts of the app
 * still import `SmartImage`. Storage URLs are now public and need no resolver.
 */
const SmartImage = forwardRef<HTMLImageElement, Props>(({ src, enabled = true, ...rest }, ref) => {
  if (!src || !enabled) return null;
  return <img ref={ref} src={src} {...rest} />;
});
SmartImage.displayName = 'SmartImage';
export default SmartImage;
