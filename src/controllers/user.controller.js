import prisma from '../config/prisma.js';

/**
 * @desc    Create a new user with initial wallet balance
 * @route   POST /api/users
 */
export async function createUser(req, res, next) {
  try {
    const { name, email, walletBalance } = req.body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Name is required and must be a non-empty string.',
      });
    }

    if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'A valid email address is required.',
      });
    }

    let initialBalance = 0.0;
    if (walletBalance !== undefined) {
      const parsedBalance = parseFloat(walletBalance);
      if (isNaN(parsedBalance) || parsedBalance < 0) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'walletBalance must be a non-negative number.',
        });
      }
      initialBalance = parsedBalance;
    }

    // Create user in PostgreSQL
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        walletBalance: initialBalance,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user,
    });
  } catch (error) {
    // Prisma unique constraint violation code is P2002
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: 'Conflict',
        message: 'A user with this email address already exists.',
      });
    }
    return next(error);
  }
}

/**
 * @desc    Add funds to a user's wallet
 * @route   POST /api/users/:id/add-funds
 */
export async function addFunds(req, res, next) {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'User ID must be a valid integer.',
      });
    }

    const { amount } = req.body;
    const parsedAmount = parseFloat(amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Amount must be a positive number greater than 0.',
      });
    }

    // Atomic increment of wallet balance in PostgreSQL
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        walletBalance: {
          increment: parsedAmount,
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: `Successfully added $${parsedAmount.toFixed(2)} to user's wallet.`,
      data: updatedUser,
    });
  } catch (error) {
    // Prisma code P2025: Record to update not found
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `User with ID ${req.params.id} does not exist.`,
      });
    }
    return next(error);
  }
}

/**
 * @desc    Get user by ID
 * @route   GET /api/users/:id
 */
export async function getUserById(req, res, next) {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'User ID must be a valid integer.',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `User with ID ${userId} does not exist.`,
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * @desc    Get all users
 * @route   GET /api/users
 */
export async function getAllUsers(req, res, next) {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    return next(error);
  }
}
