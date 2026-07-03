const CURRENCY_SYMBOLS: Record<string, string> = {
  NIO: "C$",
  USD: "$",
  EUR: "€",
  MXN: "$",
};

export const money = (n: number | string | null | undefined, currency: string = getStoredCurrency()) => {
  const v = Number(n ?? 0);
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
  const formatted = v.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${symbol} ${formatted}`;
};

const STORAGE_KEY = "caja-currency";

export function getStoredCurrency(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && CURRENCY_SYMBOLS[stored]) return stored;
  } catch { /* localStorage no disponible */ }
  return "NIO";
}

export function setStoredCurrency(currency: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, currency);
  } catch { /* localStorage no disponible */ }
}

