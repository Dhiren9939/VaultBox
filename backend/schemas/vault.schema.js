import mongoose from "mongoose";

const vaultSchema = new mongoose.Schema({
  eDEK: { type: Buffer, required: true },
  rDEK: { type: Buffer, required: true },
  entries: [
    {
      title: { type: String, required: true },
      encryptedData: { type: Buffer, required: true },
    },
  ],
});

const Vault = mongoose.model("Vault", vaultSchema);

export default Vault;
