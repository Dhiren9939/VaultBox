import mongoose from 'mongoose';

const entrySchema = new mongoose.Schema({
  cipherText: { type: String, required: true },
  iv: { type: String, required: true },
});

const Entry = mongoose.model('Entry', entrySchema);

const vaultSchema = new mongoose.Schema({
  eDEK: { type: String, required: true },
  salt: { type: String, required: true },
  iv: { type: String, required: true },
  entries: { type: [entrySchema], default: [] },
});

const Vault = mongoose.model('Vault', vaultSchema);

export { Vault, Entry };
