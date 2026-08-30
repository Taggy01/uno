import { User } from '../models/User.js';
import { generateToken } from '../middlewares/authMiddleware.js';

export async function signup(req, res) {
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

    const user = await User.create({
      username: trimmedUsername,
      email: cleanEmail,
      password,
    });

    const token = generateToken(user);
    const safeUser = user.toJSON ? user.toJSON() : {
      id: user.id || user._id,
      username: user.username,
      email: user.email,
      isGuest: user.isGuest,
      stats: user.stats,
    };

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: safeUser,
      token,
    });
  } catch (error) {
    if (error.code === 11000 || error.name === 'MongoServerError') {
      const isUsername = error.keyPattern?.username || (error.message && error.message.includes('username'));
      if (isUsername) {
        return res.status(400).json({ success: false, message: 'Username is already taken. Please choose another.' });
      }
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }
    return res.status(400).json({ success: false, message: error.message || 'Signup failed' });
  }
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
