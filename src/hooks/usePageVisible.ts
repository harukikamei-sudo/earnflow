import { useEffect, useState } from "react";

/**
 * ページ（タブ）が表示中かどうかを返すフック。
 * バックグラウンド（非表示・画面オフ）になったらタイマーやアニメを止め、
 * 電池の消費を抑えるために使う。
 */
export function usePageVisible(): boolean {
  const [visible, setVisible] = useState(() => typeof document === "undefined" || !document.hidden);
  useEffect(() => {
    const onChange = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, []);
  return visible;
}
