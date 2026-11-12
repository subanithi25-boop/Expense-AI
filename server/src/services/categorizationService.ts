import { ExpenseCategory } from '../types';

interface CategoryRule {
  category: ExpenseCategory;
  keywords: string[];
  merchants: string[];
  rationale: string;
}

const CATEGORY_RULES: CategoryRule[] = [
  {
    category: 'Groceries & Supplies',
    keywords: [
      'grocery', 'supermarket', 'organic', 'rice', 'atta', 'flour', 'milk', 'dairy',
      'cooking oil', 'oil', 'eggs', 'tomatoes', 'bananas', 'vegetables', 'fruit', 'produce',
      'detergent', 'cleaning', 'pantry', 'provisions', 'spices', 'snacks', 'beverages',
      'freshmart', 'daily needs', 'food mart', 'bazaar', 'general store', 'soap'
    ],
    merchants: [
      'freshmart', 'walmart', 'target', 'whole foods', 'kroger', 'trader joe',
      'costco', 'safeway', 'sprouts', 'aldi', 'dmart', 'big bazaar', 'zepto',
      'blinkit', 'instacart', 'reliance fresh', 'nature basket'
    ],
    rationale: 'Transaction recognized as grocery, supermarket, or pantry provisions expenditure.'
  },
  {
    category: 'Meals & Entertainment',
    keywords: [
      'restaurant', 'cafe', 'bistro', 'coffee', 'starbucks', 'diner', 'grill', 'bar',
      'lunch', 'dinner', 'breakfast', 'food', 'bakery', 'uber eats', 'doordash', 'dining',
      'catering', 'steak', 'pizza', 'burger', 'sandwich', 'dessert', 'buffet', 'pub', 'cocktail'
    ],
    merchants: [
      'starbucks', 'mcdonalds', 'chipotle', 'sweetgreen', 'subway', 'panera',
      'doordash', 'uber eats', 'ruths chris', 'the capital grille', 'cheesecake factory',
      'dunkin', 'dominos', 'pizza hut', 'shake shack', 'wendys', 'taco bell'
    ],
    rationale: 'Merchant classified under restaurant, dining, cafe, or business entertainment hospitality.'
  },
  {
    category: 'Travel',
    keywords: [
      'flight', 'airline', 'airfare', 'terminal', 'boarding pass', 'tsa', 'delta', 'united',
      'american air', 'lufthansa', 'ticket', 'baggage', 'airport', 'rail', 'amtrak', 'train booking'
    ],
    merchants: [
      'delta', 'united airlines', 'american airlines', 'southwest', 'expedia', 'booking.com',
      'kayak', 'amtrak', 'british airways', 'air france', 'emirates', 'indigo', 'air india'
    ],
    rationale: 'Transaction matches commercial airline, rail transport, or flight travel booking.'
  },
  {
    category: 'Accommodation',
    keywords: [
      'hotel', 'resort', 'inn', 'suites', 'motel', 'airbnb', 'lodging', 'night stay',
      'marriott', 'hilton', 'hyatt', 'check-in', 'check-out', 'room rate', 'occupancy'
    ],
    merchants: [
      'marriott', 'hilton', 'hyatt', 'airbnb', 'sheraton', 'westin', 'holiday inn',
      'intercontinental', 'ritz-carlton', 'four seasons', 'wyndham', 'radisson'
    ],
    rationale: 'Transaction recognized as hotel, hospitality lodging, or overnight accommodation.'
  },
  {
    category: 'Transportation',
    keywords: [
      'uber', 'lyft', 'taxi', 'cab', 'parking', 'toll', 'metro', 'subway ticket',
      'train', 'car rental', 'hertz', 'enterprise', 'rideshare', 'gas', 'fuel', 'petrol', 'diesel'
    ],
    merchants: [
      'uber', 'lyft', 'hertz', 'enterprise', 'avis', 'yellow cab', 'mta', 'parkmobile',
      'shell', 'chevron', 'exxon', 'bp', 'mobil'
    ],
    rationale: 'Ground transit, ride-share, car rental, highway toll, or fleet transit.'
  },
  {
    category: 'Office Supplies',
    keywords: [
      'staples', 'office depot', 'stationery', 'paper', 'printer ink', 'desk', 'ergonomic',
      'pens', 'notebook', 'hardware supply', 'mouse', 'keyboard', 'monitor stand', 'cables'
    ],
    merchants: ['staples', 'office depot', 'officemax', 'best buy', 'ikea', 'officeworks'],
    rationale: 'Items or vendor recognized for office stationery, workstation gear, or corporate supplies.'
  },
  {
    category: 'Software & Subscriptions',
    keywords: [
      'saas', 'cloud', 'hosting', 'aws', 'github', 'slack', 'jira', 'zoom', 'openai',
      'notion', 'google workspace', 'microsoft 365', 'adobe', 'subscription', 'license', 'api'
    ],
    merchants: [
      'amazon web services', 'aws', 'github', 'slack', 'atlassian', 'zoom', 'openai',
      'notion labs', 'google cloud', 'microsoft', 'adobe', 'jetbrains', 'figma', 'hubspot'
    ],
    rationale: 'Recognized as cloud infrastructure, developer tooling, or productivity software subscription.'
  },
  {
    category: 'Client Meetings',
    keywords: [
      'client dinner', 'executive club', 'banquet', 'client event', 'presentation room',
      'conference venue', 'meeting room', 'wework'
    ],
    merchants: ['wework', 'regus', 'private dining', 'davio', 'spaces'],
    rationale: 'Dedicated meeting space rental or client engagement hospitality.'
  },
  {
    category: 'Training & Education',
    keywords: [
      'course', 'udemy', 'coursera', 'conference pass', 'workshop', 'cert', 'certification',
      'training', 'symposium', 'summit', 'seminar', 'tutorial'
    ],
    merchants: ['udemy', 'coursera', 'oreilly', 'pluralsight', 'gartner', 'aws summit', 'ted', 'edx'],
    rationale: 'Professional education, technical certifications, or conference attendance.'
  },
  {
    category: 'Utilities',
    keywords: [
      'internet', 'telecom', 'verizon', 'at&t', 't-mobile', 'broadband', 'phone bill',
      'electricity', 'power bill', 'water utility'
    ],
    merchants: ['verizon', 'at&t', 't-mobile', 'comcast', 'xfinity', 'vodafone', 'airtel', 'jio'],
    rationale: 'Telecommunication, cellular data, or corporate utility provider.'
  }
];

export interface CategorizationResult {
  category: ExpenseCategory;
  confidence: number;
  reasoning: string;
}

export class CategorizationService {
  public static categorize(
    merchant: string,
    description: string = '',
    rawText: string = ''
  ): CategorizationResult {
    const textToAnalyze = `${merchant} ${description} ${rawText}`.toLowerCase();
    const merchantLower = merchant.toLowerCase().trim();

    // Priority 1: Check known merchant match across ALL rules
    if (merchantLower.length > 1) {
      for (const rule of CATEGORY_RULES) {
        for (const m of rule.merchants) {
          if (merchantLower.includes(m.toLowerCase()) || m.toLowerCase().includes(merchantLower)) {
            // Find any matching items/keywords in rawText to enrich reasoning
            const matchedKeywords = rule.keywords.filter(kw => textToAnalyze.includes(kw.toLowerCase()));
            const evidenceStr = matchedKeywords.length > 0
              ? ` (Matched merchant "${merchant}" with contextual items [${matchedKeywords.slice(0, 3).join(', ')}])`
              : ` (Matched merchant "${m}")`;

            return {
              category: rule.category,
              confidence: 96,
              reasoning: `${rule.rationale}${evidenceStr}`
            };
          }
        }
      }
    }

    // Priority 2: Keyword scoring across all rules
    let bestRule: CategoryRule | null = null;
    let maxMatches = 0;
    let matchedKeywords: string[] = [];

    for (const rule of CATEGORY_RULES) {
      let matches = 0;
      const currentMatched: string[] = [];
      for (const kw of rule.keywords) {
        if (textToAnalyze.includes(kw.toLowerCase())) {
          matches++;
          currentMatched.push(kw);
        }
      }
      if (matches > maxMatches) {
        maxMatches = matches;
        bestRule = rule;
        matchedKeywords = currentMatched;
      }
    }

    if (bestRule && maxMatches > 0) {
      return {
        category: bestRule.category,
        confidence: maxMatches >= 2 ? 88 : 72,
        reasoning: `${bestRule.rationale} Contextual evidence: matched [${matchedKeywords.slice(0, 4).join(', ')}].`
      };
    }

    // Default fallback when neither merchant nor keywords match
    return {
      category: 'Other',
      confidence: 40,
      reasoning: 'Unclassified commercial expenditure. Marked as Other for manual user verification.'
    };
  }
}
