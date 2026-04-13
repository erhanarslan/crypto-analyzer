import { useEffect, useMemo, useRef, useState } from "react";

type SymbolPickerProps = {
  symbols: string[];
  value: string;
  loading: boolean;
  onChange: (symbol: string) => void;
};

export default function SymbolPicker({
  symbols,
  value,
  loading,
  onChange,
}: SymbolPickerProps) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, []);

  const filteredSymbols = useMemo(() => {
    const normalized = query.trim().toUpperCase();

    if (!normalized) {
      return symbols.slice(0, 30);
    }

    return symbols.filter((item) => item.includes(normalized)).slice(0, 30);
  }, [symbols, query]);

  return (
    <div ref={wrapperRef} className="relative min-w-[220px]">
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value.toUpperCase());
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={loading ? "Coins loading..." : "Search coin..."}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
      />

      {open && (
        <div className="absolute z-20 mt-2 max-h-80 w-full overflow-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
          {filteredSymbols.length === 0 ? (
            <div className="px-3 py-2 text-sm text-slate-500">
              Sonuç bulunamadı.
            </div>
          ) : (
            filteredSymbols.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  onChange(item);
                  setQuery(item);
                  setOpen(false);
                }}
                className={`block w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                  item === value
                    ? "bg-sky-50 font-semibold text-sky-700"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                {item}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
