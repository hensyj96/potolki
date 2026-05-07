import { useEffect, useState } from 'react';
import { useOnScreen } from '../../hooks/useOnScreen';
import { Image as ImageIcon } from 'lucide-react';

type Props = {
  src: string;
  thumbSrc?: string;
  alt: string;
  className?: string;
  /** When true — load eagerly. Otherwise lazy-load via IntersectionObserver. */
  eager?: boolean;
};

/**
 * Renders a gallery image with lazy loading and graceful error fallback.
 */
export default function GalleryThumb({ src, thumbSrc, alt, className = '', eager = false }: Props) {
  const { ref, seen } = useOnScreen<HTMLDivElement>({ rootMargin: '250px' });
  const preferred = thumbSrc || src;
  const visible = eager || seen;
  const [errored, setErrored] = useState(false);

  useEffect(() => { setErrored(false); }, [preferred]);

  return (
    <div ref={ref} className={`w-full h-full ${className} relative bg-white/[0.04]`}>
      {visible && preferred && !errored ? (
        <img
          src={preferred}
          alt={alt}
          loading={eager ? undefined : 'lazy'}
          decoding="async"
          onError={() => setErrored(true)}
          className="w-full h-full object-cover"
        />
      ) : errored ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-faint">
          <ImageIcon className="w-6 h-6" />
          <span className="text-[10px] mt-1">недоступно</span>
        </div>
      ) : (
        <div className="absolute inset-0 animate-pulse bg-white/[0.05]" />
      )}
    </div>
  );
}
