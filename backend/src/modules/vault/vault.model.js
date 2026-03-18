import mongoose from 'mongoose';

const entrySchema = new mongoose.Schema({
  cipherText: { type: String, required: true },
  eIv: { type: String, required: true },
});

const Entry = mongoose.model('Entry', entrySchema);

const vaultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  eDEK: { type: String, required: true },
  reDEK: { type: String, required: true },
  kSalt: { type: String, required: true },
  rSalt: { type: String, required: true },
  kIv: { type: String, required: true },
  rIv: { type: String, required: true },
  entries: { type: [entrySchema], default: [] },
  shards: {
    type: [
      {
        senderId: {
          type: mongoose.Schema.ObjectId,
          ref: 'User',
          required: true,
        },
        shardStr: { type: String, required: true },
        shardIv: { type: String, required: true },
        recoveryRequested: { type: Boolean, default: false },
      },
    ],
    default: [],
  },
});

const Vault = mongoose.model('Vault', vaultSchema);

export { Vault, Entry };
