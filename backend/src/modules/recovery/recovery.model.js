import mongoose from 'mongoose';

const recoveryRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  ephemeralPublicKey: {
    type: String,
    required: true,
  },
  encryptedEphemeralPrivateKey: {
    type: String,
    required: true,
  },
  ephemeralIv: {
    type: String,
    required: true,
  },
  ephemeralSalt: {
    type: String,
    required: true,
  },
  intermediatePasswordHash: {
    type: String,
    required: true,
  },
  contributedShards: [
    {
      contributorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      encryptedShardStr: {
        type: String,
        required: true,
      },
      contributedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
    index: { expires: 0 },
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
});

export const RecoveryRequest = mongoose.model(
  'RecoveryRequest',
  recoveryRequestSchema
);
