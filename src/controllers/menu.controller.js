import MenuItem from '../models/menuItem.model.js';

/**
 * @desc    Add a new menu item to MongoDB catalog with flexible customizations
 * @route   POST /api/menu
 */
export async function addMenuItem(req, res, next) {
  try {
    const {
      restaurantName,
      itemName,
      basePrice,
      category,
      description,
      customizations,
      isAvailable,
    } = req.body;

    // Validation
    if (!restaurantName || typeof restaurantName !== 'string' || restaurantName.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'restaurantName is required and must be a non-empty string.',
      });
    }

    if (!itemName || typeof itemName !== 'string' || itemName.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'itemName is required and must be a non-empty string.',
      });
    }

    const parsedPrice = parseFloat(basePrice);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'basePrice must be a valid non-negative number.',
      });
    }

    if (customizations !== undefined && !Array.isArray(customizations)) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'customizations, if provided, must be an array of customization options.',
      });
    }

    // Save to MongoDB
    const menuItem = await MenuItem.create({
      restaurantName: restaurantName.trim(),
      itemName: itemName.trim(),
      basePrice: parsedPrice,
      category: category ? category.trim() : 'General',
      description: description ? description.trim() : '',
      customizations: customizations || [],
      isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
    });

    return res.status(201).json({
      success: true,
      message: 'Menu item created successfully in catalog',
      data: menuItem,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: messages.join(', '),
      });
    }
    return next(error);
  }
}

/**
 * @desc    Get all menu items or filter by restaurant / category
 * @route   GET /api/menu
 */
export async function getMenuItems(req, res, next) {
  try {
    const { restaurantName, category } = req.query;
    const filter = {};

    if (restaurantName) {
      filter.restaurantName = { $regex: new RegExp(`^${restaurantName.trim()}$`, 'i') };
    }

    if (category) {
      filter.category = { $regex: new RegExp(`^${category.trim()}$`, 'i') };
    }

    const items = await MenuItem.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * @desc    Get a single menu item by ID
 * @route   GET /api/menu/:id
 */
export async function getMenuItemById(req, res, next) {
  try {
    const { id } = req.params;
    const item = await MenuItem.findById(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Menu item with ID ${id} does not exist.`,
      });
    }

    return res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: `Invalid MongoDB ObjectId format: ${req.params.id}`,
      });
    }
    return next(error);
  }
}
