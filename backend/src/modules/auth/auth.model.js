// Refresh token persistence model.
import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  tokenHash: { type: String, required: true },
  createdAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true },
});

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);

export default RefreshToken;
