import mongoose from 'mongoose';

const entrySchema = new mongoose.Schema({
  cipherText: { type: String, required: true },
  iv: { type: String, required: true },
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
  salt: { type: String, required: true },
  iv: { type: String, required: true },
  entries: { type: [entrySchema], default: [] },
});

const Vault = mongoose.model('Vault', vaultSchema);

export { Vault, Entry };
