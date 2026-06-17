import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface PixelImageProps {
  src: string;
  /** 白に近い画素を透過する（白背景のドット絵イラスト用） */
  keyWhite?: boolean;
  /** 透過とみなす明るさのしきい値（0-255） */
  threshold?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * ドット絵イラストを canvas に描画して表示する。
 * keyWhite=true なら白背景を透過し、image-rendering: pixelated でくっきり拡大する。
 * 外部素材（dot-illust.net 等）の白背景PNG/JPEGをマップに置くのに使う。
 */
export function PixelImage({ src, keyWhite = true, threshold = 236, className, style }: PixelImageProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      const canvas = ref.current;
      if (!canvas) return;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0);
      if (keyWhite) {
        try {
          const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const d = data.data;
          for (let i = 0; i < d.length; i += 4) {
            if (d[i] >= threshold && d[i + 1] >= threshold && d[i + 2] >= threshold) {
              d[i + 3] = 0;
            }
          }
          ctx.putImageData(data, 0, 0);
        } catch {
          /* getImageData が失敗（CORS等）したらそのまま表示 */
        }
      }
    };
    img.src = src;
    return () => {
      cancelled = true;
    };
  }, [src, keyWhite, threshold]);

  return <canvas ref={ref} className={cn("pixelated", className)} style={style} aria-hidden />;
}
