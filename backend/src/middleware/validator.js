import { body, validationResult } from 'express-validator';

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: "Validation Error",
            errors: errors.array().map(err => err.msg)
        });
    }
    next();
};

export const validateRegister = [
    body('name').notEmpty().withMessage('Name is required').trim().escape(),
    body('email').isEmail().withMessage('Invalid email address').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('role').optional().isIn(['customer', 'owner']).withMessage('Invalid role'),
    handleValidationErrors
];

export const validateLogin = [
    body('email').isEmail().withMessage('Invalid email address').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
    handleValidationErrors
];

export const validatePlaceOrder = [
    body('restaurantId').isMongoId().withMessage('Invalid Restaurant ID'),
    body('tableId').isMongoId().withMessage('Invalid Table ID'),
    body('tableNo').isInt({ min: 1 }).withMessage('Table Number must be a positive integer'),
    body('items').isArray({ min: 1 }).withMessage('Items must be a non-empty array'),
    body('items.*.menuItemId').isMongoId().withMessage('Invalid Menu Item ID'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('items.*.price').isFloat({ min: 0 }).withMessage('Price must be non-negative'),
    body('totalAmount').isFloat({ min: 0 }).withMessage('Total Amount must be non-negative'),
    body('customerDetails.name').notEmpty().withMessage('Customer Name is required').trim().escape(),
    body('customerDetails.phone').notEmpty().withMessage('Customer Phone is required').trim().escape(),
    handleValidationErrors
];

export const validateUpdateStatus = [
    body('status').isIn(["PLACED", "PREPARING", "READY", "SERVED", "PAID", "COMPLETED"]).withMessage('Invalid status'),
    body('paymentStatus').optional().isIn(["PENDING", "PAID", "FAILED"]).withMessage('Invalid payment status'),
    handleValidationErrors
];
