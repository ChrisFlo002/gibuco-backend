import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const agencySchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: true,
    },
    ville: {
      type: String,
      required: true,
    },
    adresse: {
      type: String,
      required: true,
    },
    telephone: {
      type: String,
      required: true,
    },
    province:{
      type: String,
      required: true,
    },
    chef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

const Agency = mongoose.model("Agency", agencySchema);

export default Agency;
