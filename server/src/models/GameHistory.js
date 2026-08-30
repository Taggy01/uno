import mongoose from 'mongoose';

const gameHistorySchema = new mongoose.Schema(
  {
    roomCode: {
      type: String,
      required: true,
      index: true,
    },
    roomName: String,
    winner: {
      id: String,
      username: String,
      isBot: Boolean,
    },
    players: [
      {
        id: String,
        username: String,
        isBot: Boolean,
        cardsRemaining: Number,
      },
    ],
    durationSeconds: Number,
    totalTurns: Number,
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const GameHistory = mongoose.model('GameHistory', gameHistorySchema);
