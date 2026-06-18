import { useEffect, useState } from "react";

/**
 * タッチ主体の端末か（iPhone / iPad / Android など）を判定する。
 * `(pointer: coarse)` が当たる、もしくはタッチ点を持つ端末を true とする。
 * 画面上十字キー（D-pad）の表示可否に使う。
 */
function detect(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.matchMedia?.("(pointer: coarse)").matches) return true;
    return (navigator.maxTouchPoints ?? 0) > 0 || "ontouchstart" in window;
  } catch {
    return false;
  }
}

export function useIsTouch(): boolean {
  const [touch, setTouch] = useState<boolean>(detect);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(pointer: coarse)");
    const update = () => setTouch(detect());
    // Safari 14 以前は addEventListener 非対応なので addListener にフォールバック
    if (mq.addEventListener) mq.addEventListener("change", update);
    else mq.addListener(update);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", update);
      else mq.removeListener(update);
    };
  }, []);

  return touch;
}
