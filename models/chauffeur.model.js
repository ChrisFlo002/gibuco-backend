import mongoose from "mongoose";
import User from "./user.model.js";

const chauffeurSchema = new mongoose.Schema({
  licenceConduire: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

const Chauffeur = mongoose.model("Chauffeur", chauffeurSchema);

export default Chauffeur;
