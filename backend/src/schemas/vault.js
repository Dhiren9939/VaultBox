import mongoose from "mongoose";

const vaultSchema = new mongoose.Schema({
  eDEK: { type: Buffer, required: true },
  salt: { type: Buffer, required: true },
  iv: { type: Buffer, required: true },
  encryptedData: { type: Buffer, required: true },
});

const Vault = mongoose.model("Vault", vaultSchema);

export default Vault;
