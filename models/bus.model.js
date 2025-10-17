import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const carSchema = new mongoose.Schema(
  {
    immatriculation: {
      type: String,
      required: true,
      unique: true,
    },
    modele: {
      type: String,
      required: true,
    },
    capacite: {
      type: Number,
      required: true,
    },
    statut: {
      type: String,
      enum: ["disponible", "en_service", "maintenance", "hors_service"],
      default: "disponible",
    },
    images: [
      {
        type: [String],
      },
    ],
    // Reference to user (Responsible)
    chauffeur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    vin: {
      type:String
    }
  },
  {
    timestamps: true,
  }
);

const Bus = mongoose.model("Bus", carSchema);

export default Bus;
