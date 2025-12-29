export const PRICING = {
  packages: {
    single: { songs: 1, price: 5.00, label: 'Single Request', savings: 0 },
    double: { songs: 2, price: 8.00, label: 'Double Up', savings: 2 },
    party: { songs: 3, price: 12.00, label: 'Party Pack', savings: 3 },
  },
  addons: {
    priority: { price: 10.00, label: 'Priority Play', description: 'Skip the line' },
    shoutout: { price: 5.00, label: 'Shoutout', description: 'Personal dedication from the DJ' },
    guaranteedNext: { price: 20.00, label: 'Guaranteed Next', description: 'Your song plays immediately' },
  },
} as const;

export interface OrderDetails {
  package: keyof typeof PRICING.packages;
  songs: Array<{
    id: string;
    title: string;
    artist: string;
    artworkUrl: string;
    itunesUrl: string;
  }>;
  addons: {
    priority: boolean;
    shoutout: boolean;
    guaranteedNext: boolean;
  };
  requesterName?: string;
  requesterPhone: string;
  requesterEmail?: string;
}

export function calculateTotal(order: Partial<OrderDetails>): number {
  let total = 0;

  // Base package price
  if (order.package) {
    total += PRICING.packages[order.package].price;
  }

  // Add-ons
  if (order.addons?.priority) total += PRICING.addons.priority.price;
  if (order.addons?.shoutout) total += PRICING.addons.shoutout.price;
  if (order.addons?.guaranteedNext) total += PRICING.addons.guaranteedNext.price;

  return total;
}

export function formatPrice(amount: number): string {
  return `$${amount.toFixed(2)}`;
}
