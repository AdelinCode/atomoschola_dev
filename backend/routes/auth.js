import express from 'express';
import { body } from 'express-validator';
import User from '../models/User.js';
import InviteCode from '../models/InviteCode.js';
import generateToken from '../utils/generateToken.js';

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
    body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
    try {
        const { username, email, password, firstName, lastName, userType, inviteCode } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ $or: [{ email }, { username }] });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'User with this email or username already exists'
            });
        }

        // Validate invite code for creator/editor
        if (userType === 'creator' || userType === 'editor') {
            if (!inviteCode) {
                return res.status(400).json({
                    success: false,
                    message: 'Invite code is required for creator/editor accounts'
                });
            }

            const code = await InviteCode.findOne({ code: inviteCode, isUsed: false });
            if (!code) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid or already used invite code'
                });
            }

            if (code.userType !== userType) {
                return res.status(400).json({
                    success: false,
                    message: `This invite code is for ${code.userType} accounts only`
                });
            }

            // Check expiration
            if (code.expiresAt && new Date() > code.expiresAt) {
                return res.status(400).json({
                    success: false,
                    message: 'This invite code has expired'
                });
            }
        }

        // Create user
        const user = await User.create({
            username,
            email,
            password,
            firstName,
            lastName,
            userType: userType || 'user',
            inviteCode: inviteCode || null
        });

        // Mark invite code as used and DELETE it immediately
        if (inviteCode) {
            // Delete the code after use
            await InviteCode.findOneAndDelete({ code: inviteCode });
        }

        res.status(201).json({
            success: true,
            data: {
                _id: user._id,
                username: user.username,
                email: user.email,
                userType: user.userType,
                isCreatorCommissionMember: user.isCreatorCommissionMember || false,
                isEditorCommissionMember: user.isEditorCommissionMember || false,
                token: generateToken(user._id)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check for user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        res.json({
            success: true,
            data: {
                _id: user._id,
                username: user.username,
                email: user.email,
                userType: user.userType,
                firstName: user.firstName,
                lastName: user.lastName,
                isCreatorCommissionMember: user.isCreatorCommissionMember || false,
                isEditorCommissionMember: user.isEditorCommissionMember || false,
                token: generateToken(user._id)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
