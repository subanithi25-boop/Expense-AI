export interface CurrencyRate {
  code: string;
  rateToUSD: number; // 1 Foreign = X USD
  symbol: string;
}

const EXCHANGE_RATES: Record<string, CurrencyRate> = {
  USD: { code: 'USD', rateToUSD: 1.0, symbol: '$' },
  EUR: { code: 'EUR', rateToUSD: 1.08, symbol: '€' },
  GBP: { code: 'GBP', rateToUSD: 1.28, symbol: '£' },
  CAD: { code: 'CAD', rateToUSD: 0.74, symbol: 'CA$' },
  JPY: { code: 'JPY', rateToUSD: 0.0066, symbol: '¥' },
  AUD: { code: 'AUD', rateToUSD: 0.65, symbol: 'A$' },
  CHF: { code: 'CHF', rateToUSD: 1.12, symbol: 'CHF ' },
  INR: { code: 'INR', rateToUSD: 0.012, symbol: '₹' },
  SGD: { code: 'SGD', rateToUSD: 0.75, symbol: 'S$' }
};

export class CurrencyService {
  public static getSupportedCurrencies() {
    return Object.keys(EXCHANGE_RATES);
  }

  public static getRate(currencyCode: string): number {
    const entry = EXCHANGE_RATES[currencyCode.toUpperCase()];
    return entry ? entry.rateToUSD : 1.0;
  }

  public static convertToUSD(amount: number, currencyCode: string): { convertedAmount: number; rate: number } {
    const rate = this.getRate(currencyCode);
    const converted = Math.round(amount * rate * 100) / 100;
    return { convertedAmount: converted, rate };
  }

  public static format(amount: number, currencyCode: string = 'USD'): string {
    const entry = EXCHANGE_RATES[currencyCode.toUpperCase()] || EXCHANGE_RATES.USD;
    return `${entry.symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}
