import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      required: true,
      unique: true,
      default: () => `BOOKING-${uuidv4()}`,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref:"User"
    },
    trajetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref:"Trajet"
    },
    nombrePassagers: {
      type: Number,
      required: true,
    },
    dateReservation: {
      type: Date,
      default: Date.now,
    },
    statut: {
      type: String,
      enum: ["en_attente", "confirmee", "annulee", "terminee"],
      default: "en_attente",
    },
    montant:{
      type:Number,
      required:true
    },
  },
  {
    timestamps: true,
  }
);

const Reservation = mongoose.model("Reservation", bookingSchema);

export default Reservation;
