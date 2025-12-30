export interface PricingConfig {
  price_single: number;
  price_double: number;
  price_party: number;
  price_priority: number;
  price_shoutout: number;
  price_guaranteed: number;
}

export const DEFAULT_PRICING: PricingConfig = {
  price_single: 5.00,
  price_double: 8.00,
  price_party: 12.00,
  price_priority: 10.00,
  price_shoutout: 5.00,
  price_guaranteed: 20.00,
};

// Helper to generate the legacy structure for UI if needed, but better to use config directly
export function getPackagePricing(config: PricingConfig = DEFAULT_PRICING) {
    return {
        packages: {
            single: { songs: 1, price: config.price_single, label: 'Single Request', savings: 0 },
            double: { songs: 2, price: config.price_double, label: 'Double Up', savings: (config.price_single * 2) - config.price_double },
            party: { songs: 3, price: config.price_party, label: 'Party Pack', savings: (config.price_single * 3) - config.price_party },
        },
        addons: {
            priority: { price: config.price_priority, label: 'Priority Play', description: 'Skip the line' },
            shoutout: { price: config.price_shoutout, label: 'Shoutout', description: 'Personal dedication from the DJ' },
            guaranteedNext: { price: config.price_guaranteed, label: 'Guaranteed Next', description: 'Your song plays immediately' },
        },
    }
}

export interface OrderDetails {
  package: "single" | "double" | "party";
  songs: any[];
  addons: {
    priority: boolean;
    shoutout: boolean;
    guaranteedNext: boolean;
  };
}

export function calculateTotal(order: Partial<OrderDetails>, config: PricingConfig = DEFAULT_PRICING): number {
  let total = 0;
  const pricing = getPackagePricing(config);

  if (order.package && pricing.packages[order.package]) {
    total += pricing.packages[order.package].price;
  }

  // Add-ons
  if (order.addons?.priority) total += pricing.addons.priority.price;
  if (order.addons?.shoutout) total += pricing.addons.shoutout.price;
  if (order.addons?.guaranteedNext) total += pricing.addons.guaranteedNext.price;

  return total;
}

export function formatPrice(amount: number): string {
  return `$${amount.toFixed(2)}`;
}
