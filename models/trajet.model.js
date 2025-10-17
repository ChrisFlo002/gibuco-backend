import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const tripSchema = new mongoose.Schema(
  {
    villeDepart: {
      type: String,
      required: true,
    },
    villeArrivee: {
      type: String,
      required: true,
    },
    dateDepart: {
      type: Date,
      required: true,
    },
    heureDepart: {
      type: String,
      required: true,
    },
    prix: {
      type: Number,
      required: true,
    },
    busId: {
      type: mongoose.Schema.Types.ObjectId,
      ref:"Bus",
      required: true,
    },
    heureArrivee: {
      type: String,
      required: false,
    },
    passagersArrive: {
      type: Number,
      default: 0,
    },
    incidents: {
      type: String,
      default: "",
    },
    statut: {
      type: String,
      enum: ["programme", "en_cours", "termine", "annule"],
      default: "programme",
    },
    distance:{
      type: Number,
      required: true,
    },
    capacite: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Trajet = mongoose.model("Trajet", tripSchema);

export default Trajet;
