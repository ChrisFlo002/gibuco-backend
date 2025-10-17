import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema({
  reservationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Reservation",
    required: true,
  },
  numeroSiege: {
    type: [String],
  },
  dateEmission: {
    type: Date,
    default: Date.now,
  },
});

const Ticket = mongoose.model("Ticket", ticketSchema);

export default Ticket;
