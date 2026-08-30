import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      trim: true,
      minlength: [2, 'Username must be at least 2 characters'],
      maxlength: [30, 'Username must not exceed 30 characters'],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
    },
    password: {
      type: String,
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    isGuest: {
      type: Boolean,
      default: false,
    },
    stats: {
      gamesPlayed: { type: Number, default: 0 },
      wins: { type: Number, default: 0 },
      score: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        return ret;
      },
    },
  }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) {
    return;
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (err) {
    throw err;
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Fallback in-memory store for environments without active local MongoDB daemon
const memoryUsers = new Map();
const memoryUsersByEmail = new Map();
const memoryUsersByUsername = new Map();

userSchema.statics.createGuest = async function (nickname) {
  const username = nickname || `Player_${Math.floor(1000 + Math.random() * 9000)}`;
  if (mongoose.connection.readyState === 1) {
    const guest = new this({
      username,
      isGuest: true,
    });
    return guest.save();
  } else {
    const id = 'guest_' + Math.random().toString(36).substring(2, 9);
    const guest = {
      id,
      _id: id,
      username,
      isGuest: true,
      stats: { gamesPlayed: 0, wins: 0, score: 0 },
      createdAt: new Date(),
    };
    memoryUsers.set(id, guest);
    return guest;
  }
};

export const MongooseUserModel = mongoose.model('User', userSchema);

// Resilient wrapper providing seamless MongoDB operations with offline fallback
export const User = {
  async create({ username, email, password }) {
    if (mongoose.connection.readyState === 1) {
      const doc = await MongooseUserModel.create({ username, email, password });
      return doc.toJSON ? doc.toJSON() : doc;
    }
    const cleanEmail = email ? email.toLowerCase().trim() : null;
    const cleanUsername = username ? username.trim() : null;
    if (cleanEmail && memoryUsersByEmail.has(cleanEmail)) {
      const err = new Error('User with this email already exists');
      err.code = 11000;
      err.keyPattern = { email: 1 };
      throw err;
    }
    if (cleanUsername && memoryUsersByUsername.has(cleanUsername.toLowerCase())) {
      const err = new Error('Username is already taken');
      err.code = 11000;
      err.keyPattern = { username: 1 };
      throw err;
    }
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const id = 'usr_' + Math.random().toString(36).substring(2, 9);
    const user = {
      id,
      _id: id,
      username: cleanUsername,
      email: cleanEmail,
      password: passwordHash,
      isGuest: false,
      stats: { gamesPlayed: 0, wins: 0, score: 0 },
      createdAt: new Date(),
      async comparePassword(candidate) {
        return bcrypt.compare(candidate, this.password);
      },
    };
    memoryUsers.set(id, user);
    if (cleanEmail) memoryUsersByEmail.set(cleanEmail, user);
    if (cleanUsername) memoryUsersByUsername.set(cleanUsername.toLowerCase(), user);
    const { password: _, ...safeUser } = user;
    return safeUser;
  },

  findOne(query) {
    if (mongoose.connection.readyState === 1) {
      return MongooseUserModel.findOne(query);
    }
    const findPromise = (async () => {
      if (query.email) {
        const cleanEmail = query.email.toString().toLowerCase().trim();
        return memoryUsersByEmail.get(cleanEmail) || null;
      }
      if (query.username) {
        const cleanUsername = query.username.toString().toLowerCase().trim();
        return memoryUsersByUsername.get(cleanUsername) || null;
      }
      if (query.$or && Array.isArray(query.$or)) {
        for (const condition of query.$or) {
          if (condition.email) {
            const u = memoryUsersByEmail.get(condition.email.toString().toLowerCase().trim());
            if (u) return u;
          }
          if (condition.username) {
            const u = memoryUsersByUsername.get(condition.username.toString().toLowerCase().trim());
            if (u) return u;
          }
        }
      }
      if (query._id || query.id) {
        return memoryUsers.get(query._id || query.id) || null;
      }
      return null;
    })();
    findPromise.select = () => findPromise;
    return findPromise;
  },

  async findById(id) {
    if (mongoose.connection.readyState === 1) {
      return MongooseUserModel.findById(id);
    }
    const user = memoryUsers.get(id);
    if (!user) return null;
    const { password: _, ...safeUser } = user;
    return safeUser;
  },

  async findByIdAndUpdate(id, update) {
    if (mongoose.connection.readyState === 1) {
      return MongooseUserModel.findByIdAndUpdate(id, update);
    }
    const user = memoryUsers.get(id);
    if (user && update.$inc) {
      if (update.$inc['stats.wins']) user.stats.wins += update.$inc['stats.wins'];
      if (update.$inc['stats.gamesPlayed']) user.stats.gamesPlayed += update.$inc['stats.gamesPlayed'];
      if (update.$inc['stats.score']) user.stats.score += update.$inc['stats.score'];
    }
    return user;
  },

  async createGuest(nickname) {
    const username = nickname || `Player_${Math.floor(1000 + Math.random() * 9000)}`;
    if (mongoose.connection.readyState === 1) {
      const guest = new MongooseUserModel({
        username,
        isGuest: true,
      });
      const saved = await guest.save();
      return saved.toJSON ? saved.toJSON() : saved;
    } else {
      const id = 'guest_' + Math.random().toString(36).substring(2, 9);
      const guest = {
        id,
        _id: id,
        username,
        isGuest: true,
        stats: { gamesPlayed: 0, wins: 0, score: 0 },
        createdAt: new Date(),
      };
      memoryUsers.set(id, guest);
      return guest;
    }
  },
};
