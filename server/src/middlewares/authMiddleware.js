import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'uno-super-secret-key-12345';

export function generateToken(user) {
  const id = user.id || user._id?.toString();
  return jwt.sign(
    { id, username: user.username, isGuest: Boolean(user.isGuest) },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (token && token !== 'undefined' && token !== 'null' && token !== '') {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.isGuest) {
          req.user = { id: decoded.id, username: decoded.username, isGuest: true };
          return next();
        }

        const user = await User.findById(decoded.id);
        if (user) {
          req.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            isGuest: user.isGuest,
          };
          return next();
        }
      } catch (err) {
        // Token invalid, check body fallback
      }
    }

    // Fallback if request contains player identity in body
    if (req.body?.user?.id || req.body?.hostId) {
      req.user = {
        id: req.body.user?.id || req.body.hostId || ('guest_' + Math.random().toString(36).substring(2, 9)),
        username: req.body.user?.username || req.body.hostUsername || 'Player',
        isGuest: true,
      };
      return next();
    }

    // Default guest for anonymous creation
    req.user = {
      id: 'guest_' + Math.random().toString(36).substring(2, 9),
      username: 'Player_' + Math.floor(1000 + Math.random() * 9000),
      isGuest: true,
    };
    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
