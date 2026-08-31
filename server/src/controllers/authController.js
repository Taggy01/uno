import { User } from '../models/User.js';
import { generateToken } from '../middlewares/authMiddleware.js';
import { sendOtpEmail } from '../services/emailService.js';

// In-memory OTP cache for signups (email -> { otp, expiresAt, username, email, password })
const pendingOtps = new Map();

export async function sendOtp(req, res) {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const trimmedUsername = username.trim();
    const cleanEmail = email.toLowerCase().trim();

    if (trimmedUsername.length < 2 || trimmedUsername.length > 30) {
      return res.status(400).json({ success: false, message: 'Username must be between 2 and 30 characters' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    const existingEmail = await User.findOne({ email: cleanEmail });
    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    const existingUsername = await User.findOne({ username: trimmedUsername });
    if (existingUsername) {
      return res.status(400).json({ success: false, message: 'Username is already taken. Please choose another.' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    pendingOtps.set(cleanEmail, {
      otp,
      expiresAt,
      username: trimmedUsername,
      email: cleanEmail,
      password,
    });

    // Send Real Email OTP
    await sendOtpEmail(cleanEmail, otp, trimmedUsername);

    return res.status(200).json({
      success: true,
      message: `Verification code sent to ${cleanEmail}. Please check your inbox.`,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to send OTP' });
  }
}


export async function verifyOtpAndSignup(req, res) {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const record = pendingOtps.get(cleanEmail);

    if (!record) {
      return res.status(400).json({ success: false, message: 'No pending verification found. Please request a new OTP.' });
    }

    if (Date.now() > record.expiresAt) {
      pendingOtps.delete(cleanEmail);
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new OTP.' });
    }

    if (record.otp !== otp.toString().trim()) {
      return res.status(400).json({ success: false, message: 'Invalid OTP code. Please check and try again.' });
    }

    // Create User Account
    const user = await User.create({
      username: record.username,
      email: record.email,
      password: record.password,
    });

    pendingOtps.delete(cleanEmail);

    const token = generateToken(user);
    const safeUser = user.toJSON ? user.toJSON() : {
      id: user.id || user._id,
      username: user.username,
      email: user.email,
      isGuest: user.isGuest,
      stats: user.stats,
      createdAt: user.createdAt,
    };

    return res.status(201).json({
      success: true,
      message: 'Account verified and created successfully!',
      user: safeUser,
      token,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Verification failed' });
  }
}

export async function signup(req, res) {
  // Legacy / Direct signup fallback
  return sendOtp(req, res);
}

export async function login(req, res) {
  try {
    const { email, password, username } = req.body;
    const identifier = (email || username || '').trim();

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Email/Username and password are required' });
    }

    const query = identifier.includes('@')
      ? User.findOne({ email: identifier.toLowerCase() })
      : User.findOne({
          $or: [
            { email: identifier.toLowerCase() },
            { username: identifier }
          ]
        });

    const user = query.select ? await query.select('+password') : await query;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email/username or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email/username or password' });
    }

    const token = generateToken(user);
    const safeUser = user.toJSON ? user.toJSON() : {
      id: user.id || user._id,
      username: user.username,
      email: user.email,
      isGuest: user.isGuest,
      stats: user.stats,
      createdAt: user.createdAt,
    };

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      user: safeUser,
      token,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Login failed' });
  }
}

export async function guestSession(req, res) {
  try {
    const { nickname } = req.body;
    const user = await User.createGuest(nickname);
    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      user,
      token,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Guest session failed' });
  }
}

export async function getProfile(req, res) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current password and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isGuest) {
      return res.status(400).json({ success: false, message: 'Guest accounts do not have passwords. Please register an account.' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    if (user.save) {
      await user.save();
    } else {
      // In-memory update
      const bcrypt = (await import('bcryptjs')).default;
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to change password' });
  }
}

