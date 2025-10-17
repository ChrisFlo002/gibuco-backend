import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const paymentSchema = new mongoose.Schema(
  {
    paymentId: {
      type: String,
      required: true,
      unique: true,
      default: () => `PAYMENT-${uuidv4()}`,
    },
    reservationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reservation",
      required: true,
    },
    montant: {
      type: Number,
      required: true,
    },
    methodePaiement: {
      type: String,
      enum: ["Lumicash", "cash", "Ecocash", "Enoti","AfriPay"],
      required: true,
    },
    datePaiement: {
      type: Date,
      default: Date.now,
    },
    statut: {
      type: String,
      enum: ["en_attente", "complete", "echoue", "rembourse"],
      default: "en_attente",
    },
  },
  {
    timestamps: true,
  }
);

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
