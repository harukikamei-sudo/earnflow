import { LOCALE_LABELS, LOCALES, setLocale, useLocale } from "@/i18n";
import { cn } from "@/lib/utils";

/** 言語切替（横並びボタン）。タイトルや家で使う。 */
export function LanguageSelect() {
  const locale = useLocale();
  return (
    <div className="no-scrollbar flex max-h-28 flex-wrap justify-center gap-1 overflow-y-auto">
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          className={cn(
            "font-pixel rounded px-2 py-1 text-[11px] transition-colors",
            l === locale ? "bg-gold text-black" : "bg-white/10 text-white hover:bg-white/20",
          )}
        >
          {LOCALE_LABELS[l]}
        </button>
      ))}
    </div>
  );
}
