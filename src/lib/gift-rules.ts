/**
 * Gift Rule Logic for IV RELIFE
 * Handles automatic gift addition and eligibility checking
 */

import { Product, GiftRule, CartLineItem, GiftSuggestion } from '@/types/products';
import { sampleProducts, giftRules } from '@/data/sampleProducts';

export class GiftRuleEngine {
  private giftRules: GiftRule[];
  private products: Product[];

  constructor(giftRules: GiftRule[] = [], products: Product[] = []) {
    this.giftRules = giftRules;
    this.products = products;
  }

  /**
   * Check if a product is eligible for gift rules
   */
  isProductGiftEligible(product: Product): boolean {
    return product.gift_eligible === true && !!product.gift_rule_id;
  }

  /**
   * Get gift rule by ID
   */
  getGiftRule(ruleId: string): GiftRule | undefined {
    return this.giftRules.find(rule => rule.id === ruleId);
  }

  /**
   * Get product by ID
   */
  getProduct(productId: string): Product | undefined {
    return this.products.find(product => product.id === productId);
  }

  /**
   * Check if a cart line item triggers any gift rules
   */
  checkGiftEligibility(lineItem: CartLineItem): GiftSuggestion[] {
    const suggestions: GiftSuggestion[] = [];
    const product = this.getProduct(lineItem.product_id);
    
    if (!product || !this.isProductGiftEligible(product)) {
      return suggestions;
    }

    // Find applicable gift rules
    const applicableRules = this.giftRules.filter(rule => {
      // Check if product is in trigger list
      if (!rule.trigger_product_ids.includes(product.id)) {
        return false;
      }

      // Check minimum product price if specified
      if (rule.min_product_price_usd) {
        const productPrice = product.sale_price_usd || product.price_usd;
        if (productPrice < rule.min_product_price_usd) {
          return false;
        }
      }

      return true;
    });

    // Create suggestions for each applicable rule
    for (const rule of applicableRules) {
      const giftProduct = this.getProduct(rule.gift_product_id);
      
      if (giftProduct) {
        suggestions.push({
          gift_rule: rule,
          gift_product: giftProduct,
          trigger_products: [product],
          eligible: true
        });
      }
    }

    return suggestions;
  }

  /**
   * Check all line items in a cart for gift eligibility
   */
  checkCartGiftEligibility(lineItems: CartLineItem[]): GiftSuggestion[] {
    const allSuggestions: GiftSuggestion[] = [];
    
    for (const lineItem of lineItems) {
      const suggestions = this.checkGiftEligibility(lineItem);
      allSuggestions.push(...suggestions);
    }

    // Remove duplicates based on gift rule ID
    const uniqueSuggestions = allSuggestions.reduce((acc, suggestion) => {
      const existing = acc.find(s => s.gift_rule.id === suggestion.gift_rule.id);
      if (!existing) {
        acc.push(suggestion);
      } else {
        // Merge trigger products if rule already exists
        existing.trigger_products.push(...suggestion.trigger_products);
      }
      return acc;
    }, [] as GiftSuggestion[]);

    return uniqueSuggestions;
  }

  /**
   * Automatically add gift items to cart based on rules
   */
  autoAddGifts(lineItems: CartLineItem[]): CartLineItem[] {
    const suggestions = this.checkCartGiftEligibility(lineItems);
    const autoGifts: CartLineItem[] = [];

    for (const suggestion of suggestions) {
      if (suggestion.gift_rule.auto_add_gift && suggestion.eligible) {
        // Check if gift is already in cart
        const existingGift = lineItems.find(item => 
          item.product_id === suggestion.gift_product.id && item.is_gift
        );

        if (!existingGift) {
          const giftLineItem: CartLineItem = {
            id: `gift-${suggestion.gift_rule.id}-${Date.now()}`,
            product_id: suggestion.gift_product.id,
            product: suggestion.gift_product,
            quantity: suggestion.gift_rule.gift_quantity,
            is_gift: true,
            gift_rule_id: suggestion.gift_rule.id,
            shipping_profile_id: this.getGiftShippingProfile(suggestion.gift_rule),
            white_glove_selected: false,
            extended_warranty_selected: false,
            price_override: suggestion.gift_rule.gift_price_zeroed ? 0 : undefined
          };

          autoGifts.push(giftLineItem);
        }
      }
    }

    return autoGifts;
  }

  /**
   * Get shipping profile for gift items
   */
  private getGiftShippingProfile(giftRule: GiftRule): string {
    switch (giftRule.gift_shipping_option) {
      case 'small_parcel':
        return 'small_parcel';
      case 'white_glove':
        return 'large_home_delivery_curbside_or_whiteglove';
      case 'included_with_main':
        return 'large_home_delivery_curbside_or_whiteglove';
      default:
        return 'small_parcel';
    }
  }

  /**
   * Calculate gift value savings for a cart
   */
  calculateGiftSavings(lineItems: CartLineItem[]): number {
    return lineItems
      .filter(item => item.is_gift && item.price_override === 0)
      .reduce((total, item) => {
        const originalPrice = item.product.sale_price_usd || item.product.price_usd;
        return total + (originalPrice * item.quantity);
      }, 0);
  }

  /**
   * Validate gift rules for admin interface
   */
  validateGiftRule(rule: Partial<GiftRule>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!rule.name || rule.name.trim().length === 0) {
      errors.push('Gift rule name is required');
    }

    if (!rule.trigger_product_ids || rule.trigger_product_ids.length === 0) {
      errors.push('At least one trigger product is required');
    }

    if (!rule.gift_product_id) {
      errors.push('Gift product is required');
    }

    if (rule.gift_quantity && rule.gift_quantity <= 0) {
      errors.push('Gift quantity must be greater than 0');
    }

    if (rule.min_product_price_usd && rule.min_product_price_usd < 0) {
      errors.push('Minimum product price cannot be negative');
    }

    if (rule.min_order_value_usd && rule.min_order_value_usd < 0) {
      errors.push('Minimum order value cannot be negative');
    }

    // Check if gift product exists
    if (rule.gift_product_id && !this.getProduct(rule.gift_product_id)) {
      errors.push('Gift product not found');
    }

    // Check if trigger products exist
    if (rule.trigger_product_ids) {
      for (const productId of rule.trigger_product_ids) {
        if (!this.getProduct(productId)) {
          errors.push(`Trigger product not found: ${productId}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get all gift rules that apply to a specific product
   */
  getGiftRulesForProduct(productId: string): GiftRule[] {
    return this.giftRules.filter(rule => 
      rule.trigger_product_ids.includes(productId)
    );
  }

  /**
   * Check if adding a product would trigger new gifts
   */
  previewGiftTriggers(productId: string, currentCart: CartLineItem[]): GiftSuggestion[] {
    const product = this.getProduct(productId);
    if (!product) return [];

    const mockLineItem: CartLineItem = {
      id: 'preview',
      product_id: productId,
      product,
      quantity: 1,
      is_gift: false,
      shipping_profile_id: product.shipping_profile_id,
      white_glove_selected: false,
      extended_warranty_selected: false
    };

    const suggestions = this.checkGiftEligibility(mockLineItem);
    
    // Filter out gifts that are already in cart
    return suggestions.filter(suggestion => {
      const existingGift = currentCart.find(item => 
        item.product_id === suggestion.gift_product.id && item.is_gift
      );
      return !existingGift;
    });
  }
}

// Create default instance with sample data
export const defaultGiftEngine = new GiftRuleEngine(giftRules, sampleProducts);

// Export utility functions for direct use
export const checkProductGiftEligibility = (product: Product): boolean => {
  return defaultGiftEngine.isProductGiftEligible(product);
};

export const getGiftSuggestions = (lineItems: CartLineItem[]): GiftSuggestion[] => {
  return defaultGiftEngine.checkCartGiftEligibility(lineItems);
};

export const autoAddGiftItems = (lineItems: CartLineItem[]): CartLineItem[] => {
  return defaultGiftEngine.autoAddGifts(lineItems);
};

export const calculateGiftSavings = (lineItems: CartLineItem[]): number => {
  return defaultGiftEngine.calculateGiftSavings(lineItems);
};