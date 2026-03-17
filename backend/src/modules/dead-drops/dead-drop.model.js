import mongoose from 'mongoose';

const shardSchema = new mongoose.Schema(
  {
    senderId: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
    shardStr: { type: String, required: true },
  },
  { timestamps: true }
);

const deadDropSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    shards: { type: [shardSchema], default: [] },
  },
  { timestamps: true }
);

export const DeadDrop = mongoose.model('DeadDrop', deadDropSchema);
