import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  vault: { type: mongoose.Schema.Types.ObjectId, ref: "Vault" },
});

const User = mongoose.model("User", userSchema);

export default User;
