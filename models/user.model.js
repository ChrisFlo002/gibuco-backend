import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      default: () => `USER-${uuidv4()}`,
    },
    nom: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["Admin", "Agent", "Chauffeur","Client"],
      required: true,
    },
    telephone: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    motDePasse: {
      type: String,
      required: true,
      select: false,
    },
    statut: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Method to check if password matches
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.motDePasse);
};

// Encrypt password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("motDePasse")) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.motDePasse = await bcrypt.hash(this.motDePasse, salt);
});
// Sign jwt token
userSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
}
const User = mongoose.model("User", userSchema);

export default User;
