import mongoose from 'mongoose';

const vaultSchema = new mongoose.Schema({
  eDEK: { type: String, required: true },
  salt: { type: String, required: true },
  iv: { type: String, required: true },
  entries: { type: Array, required: true },
});

const Vault = mongoose.model('Vault', vaultSchema);

export default Vault;
