import User from '../models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendEmail } from '../utils/emailSender.js';
import RSVP from '../models/Rsvp.js';
import Event from '../models/Event.js';

// Helper function to generate tokens
const generateTokens = (user) => {
    // Generate access token (short-lived)
    const accessToken = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '2h' } // Access token expires in 2 hours
    );

    // Generate refresh token (long-lived)
    const refreshToken = jwt.sign(
        { id: user._id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' } // Refresh token expires in 7 days
    );

    return { accessToken, refreshToken };
};

// signup
export const signup = async (req, res, next) => {
    try {
        const { firstName, lastName, email, password, role } = req.body;

        // 1. Validate Required Fields
        if (!firstName || !lastName || !email || !password || !role) {
            return res.status(400).json({ message: "All fields are required." });
        }

        // 2. Validate Name Fields (Only Letters)
        if (!/^[a-zA-Z]+$/.test(firstName.trim())) {
            return res.status(400).json({ message: "First name must contain only letters." });
        }
        if (!/^[a-zA-Z]+$/.test(lastName.trim())) {
            return res.status(400).json({ message: "Last name must contain only letters." });
        }

        // 3. Validate Email (Format + Gmail Only)
        const emailTrimmed = email.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@gmail\.com$/; // Accept only emails ending with @gmail.com
        if (!emailRegex.test(emailTrimmed)) {
            return res.status(400).json({ message: "Invalid email. Only Gmail addresses are allowed." });
        }

        // 4. Validate Role
        const validRoles = ['organizer', 'participant'];
        if (!validRoles.includes(role.toLowerCase())) {
            return res.status(400).json({
                message: "Invalid role. Role must be either 'organizer' or 'participant'.",
            });
        }

        // 5. Validate Password Strength
        const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                message:
                    "Password must be at least 8 characters long, include an uppercase letter, a lowercase letter, a number, and a special character.",
            });
        }

        // 6. Check for Existing Email (Case Insensitive)
        const existingUser = await User.findOne({ email: emailTrimmed });
        if (existingUser) {
            return res.status(409).json({ message: "Email is already registered." });
        }

        // 7. Create and Save the User (Password Hashing Done in Pre-Save Hook)
        const newUser = new User({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: emailTrimmed, // Email already trimmed and lowercased
            password, // Pass the raw password; the model's pre-save hook will hash it
            role: role.toLowerCase(),
        });

        await newUser.save();

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(newUser);

        // Save refresh token to user (in database)
        newUser.refreshToken = refreshToken;
        await newUser.save();

        // Set refresh token in HTTP-only cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(201).json({
            message: "User registered successfully.",
            accessToken,
            user: {
                id: newUser._id,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                email: newUser.email,
                role: newUser.role,
            },
        });
    } catch (error) {
        next(error); // Pass error to centralized error handler
    }
};

// Login
export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Validate email and password
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required." });
        }

        // Find the user by email (case-insensitive)
        const user = await User.findOne({ email: email.trim().toLowerCase() });

        if (!user) {
            return res.status(404).json({ message: "Cannot log in. User does not exist. Please sign up first." });
        }

        // Validate the password
        const isPasswordValid = await bcrypt.compare(password.trim(), user.password);

        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid email or password." });
        }

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user);

        // Save refresh token to user
        user.refreshToken = refreshToken;
        await user.save();

        // Set refresh token in HTTP-only cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(200).json({
            message: "Login successful",
            accessToken,
            refreshToken,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        next(error);
    }
};

// Refresh Token
export const refreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({ message: "No refresh token provided." });
        }

        // Verify refresh token
        if (!process.env.JWT_REFRESH_SECRET) {
            return res.status(500).json({ message: "Server configuration error: JWT secret missing." });
        }

        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        // Find user and check if refresh token matches
        const user = await User.findOne({
            _id: decoded.id,
            refreshToken: refreshToken
        });

        if (!user) {
            return res.status(401).json({ message: "Invalid refresh token." });
        }

        // Generate new tokens
        const tokens = generateTokens(user);

        // Update refresh token in database
        user.refreshToken = tokens.refreshToken;
        await user.save();

        // Set new refresh token in HTTP-only cookie
        res.cookie('refreshToken', tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(200).json({
            message: "Token refreshed successfully",
            accessToken: tokens.accessToken
        });
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: "Invalid refresh token." });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: "Refresh token has expired." });
        }
        next(error);
    }
};

// Logout
export const logout = async (req, res, next) => {
    try {
        const { refreshToken } = req.cookies;

        if (refreshToken) {
            // Find user and remove refresh token
            const user = await User.findOne({ refreshToken });
            if (user) {
                user.refreshToken = null;
                await user.save();
            }
        }

        // Clear refresh token cookie
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        return res.status(200).json({ success: true, message: "Logged out successfully" });
    } catch (error) {
        next(error);
    }
};

// Get Authenticated User Details
export const getMe = async (req, res, next) => {
    try {
        // Accept either _id or id from req.user
        const userId = req.user._id || req.user.id;
        if (!userId) {
            return res.status(401).json({ message: "Not authenticated or user ID missing." });
        }

        // Fetch the full user details from the database
        const user = await User.findById(userId).select('-password -refreshToken -resetPasswordToken -resetPasswordExpires');

        if (!user) {
            return res.status(404).json({ message: "User not found in database." });
        }

        // Return only the necessary fields
        const userDetails = {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
        };
        res.status(200).json({ user: userDetails });
    } catch (error) {
        next(error);
    }
};

// Request Password Reset
export const requestPasswordReset = async (req, res, next) => {
    try {
        const { email } = req.body;

        // Validate email
        if (!email) {
            return res.status(400).json({ message: "Email is required." });
        }

        const emailTrimmed = email.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@gmail\.com$/;
        if (!emailRegex.test(emailTrimmed)) {
            return res.status(400).json({ message: "Invalid email. Only Gmail addresses are allowed." });
        }

        // Find user
        const user = await User.findOne({ email: emailTrimmed });
        if (!user) {
            return res.status(404).json({ message: "No account found with this email address." });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = Date.now() + 3600000; // Token valid for 1 hour

        // Save token to user
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = resetTokenExpiry;
        await user.save();

        // Create reset URL
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

        // Enhanced email content
        const emailContent = `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6fb; padding: 40px 0;">
    <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); overflow: hidden;">
      <div style="background: #1a237e; padding: 24px 0; text-align: center;">
        <span style="font-size: 2rem; color: #fff; font-weight: bold; letter-spacing: 1px;">EventEase</span>
      </div>
      <div style="padding: 32px 24px 16px 24px;">
        <h2 style="color: #1a237e; text-align: center; margin-bottom: 16px;">Password Reset Request</h2>
        <p style="color: #333; font-size: 1.05rem; margin-bottom: 24px;">
          Hello <b>${user.firstName}</b>,<br>
          We received a request to reset the password for your EventEase account.<br>
          Click the button below to reset your password. This link will expire in <b>1 hour</b>.
        </p>
        <div style="text-align: center; margin-bottom: 32px;">
          <a href="${resetUrl}" style="background: #3949ab; color: #fff; padding: 14px 36px; border-radius: 6px; text-decoration: none; font-size: 1.1rem; font-weight: 600; display: inline-block; box-shadow: 0 2px 6px rgba(58,79,170,0.08);">
            Reset Password
          </a>
        </div>
        <div style="background: #fffbe6; border-left: 4px solid #ffd600; padding: 16px 18px; border-radius: 6px; margin-bottom: 24px;">
          <strong style="color: #bfa100;">Important:</strong>
          <ul style="color: #bfa100; margin: 8px 0 0 18px; padding: 0; font-size: 0.98rem;">
            <li>This link will expire in 1 hour</li>
            <li>If you didn't request this password reset, please ignore this email</li>
            <li>For security, this link can only be used once</li>
          </ul>
        </div>
        <p style="color: #888; font-size: 0.98rem; margin-bottom: 0;">
          If the button above doesn't work, copy and paste this link into your browser:<br>
          <a href="${resetUrl}" style="color: #3949ab; word-break: break-all;">${resetUrl}</a>
        </p>
      </div>
      <div style="background: #f4f6fb; color: #aaa; text-align: center; font-size: 0.95rem; padding: 18px 0 10px 0;">
        &copy; ${new Date().getFullYear()} EventEase. All rights reserved.
      </div>
    </div>
  </div>
`;

        console.log("Calling sendEmail for:", user.email); // Debug log
        const emailResult = await sendEmail(user.email, "Password Reset Request - EventEase", emailContent);
        console.log("sendEmail result:", emailResult); // Debug log

        res.status(200).json({ message: "Password reset instructions sent to your email." });
    } catch (error) {
        next(error);
    }
};

// Reset Password
export const resetPassword = async (req, res, next) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        // Validate password
        if (!password || password.length < 8) {
            return res.status(400).json({ message: "Password must be at least 8 characters long." });
        }

        // Find user by reset token and check expiry
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: "Password reset token is invalid or has expired." });
        }

        // Update user's password and clear reset token fields
        user.password = password; // Let pre-save hook hash it
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        console.log('Before save:', user.password); // Debug log
        await user.save();
        console.log('After save:', user.password); // Debug log

        res.status(200).json({ success: true, message: "Password has been reset successfully." });
    } catch (error) {
        next(error);
    }
};

// Update Profile
export const updateProfile = async (req, res, next) => {
    try {
        const userId = req.user._id || req.user.id;
        if (!userId) {
            return res.status(401).json({ message: "Not authenticated or user ID missing." });
        }
        const { firstName, lastName } = req.body;
        if (!firstName || !lastName) {
            return res.status(400).json({ message: "First name and last name are required." });
        }
        // Validate names
        if (!/^[a-zA-Z]+$/.test(firstName.trim()) || !/^[a-zA-Z]+$/.test(lastName.trim())) {
            return res.status(400).json({ message: "Names must contain only letters." });
        }
        const user = await User.findByIdAndUpdate(
            userId,
            { firstName: firstName.trim(), lastName: lastName.trim() },
            { new: true, runValidators: true, select: '-password -refreshToken -resetPasswordToken -resetPasswordExpires' }
        );
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        res.status(200).json({ message: "Profile updated successfully.", user });
    } catch (error) {
        next(error);
    }
};

// Delete Account
export const deleteAccount = async (req, res, next) => {
    try {
        const userId = req.user._id || req.user.id;
        if (!userId) {
            return res.status(401).json({ message: "Not authenticated or user ID missing." });
        }
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        // Delete RSVPs
        await RSVP.deleteMany({ participantId: userId });
        // If organizer, delete their events and related RSVPs
        if (user.role === 'organizer') {
            const events = await Event.find({ organizerId: userId });
            const eventIds = events.map(e => e._id);
            await Event.deleteMany({ organizerId: userId });
            await RSVP.deleteMany({ eventId: { $in: eventIds } });
        }
        // Delete user
        await User.findByIdAndDelete(userId);
        res.status(200).json({ message: "Account deleted successfully." });
    } catch (error) {
        next(error);
    }
};
    
