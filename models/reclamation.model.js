import mongoose from "mongoose";

const reclamationSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  sujet: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  statut: {
    type: String,
    enum: ["ouverte", "en_cours", "resolue", "fermee"],
    default: "ouverte",
  },
  dateCreation: {
    type: Date,
    default: Date.now,
  },
});

const Reclamation = mongoose.model("Reclamation", reclamationSchema);

export default Reclamation;
