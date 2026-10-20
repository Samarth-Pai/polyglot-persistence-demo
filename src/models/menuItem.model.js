import mongoose from 'mongoose';

/**
 * MenuItem Schema
 * Designed for polyglot persistence where the catalog needs high schema flexibility.
 * Uses Schema.Types.Mixed for `customizations` to accommodate diverse restaurant
 * configurations (e.g., pizza crusts, burger doneness, sizes, add-on toppings, allergen flags).
 */
const menuItemSchema = new mongoose.Schema(
  {
    restaurantName: {
      type: String,
      required: [true, 'Restaurant name is required'],
      trim: true,
      index: true,
    },
    itemName: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    basePrice: {
      type: Number,
      required: [true, 'Base price is required'],
      min: [0, 'Base price must be a non-negative number'],
    },
    category: {
      type: String,
      trim: true,
      default: 'General',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    // Flexible array of mixed types allowing varied nested structures per restaurant
    customizations: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    // Ensures mixed types are serialized cleanly
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Helpful compound index for fast catalog searches per restaurant
menuItemSchema.index({ restaurantName: 1, itemName: 1 });

const MenuItem = mongoose.model('MenuItem', menuItemSchema);

export default MenuItem;
