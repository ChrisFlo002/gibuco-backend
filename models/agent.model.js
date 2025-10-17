import mongoose from "mongoose";
import User from "./user.model.js";

const agentSchema = new mongoose.Schema({
  agenceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Agency",
    required: false,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

agentSchema.methods.enregistrerTrajet = function (trajetData) {
  const Trajet = mongoose.model("Trajet");
  return new Trajet(trajetData).save();
};

agentSchema.methods.affecterChauffeur = function (trajetId, chauffeurId) {
  const Trajet = mongoose.model("Trajet");
  return Trajet.findByIdAndUpdate(trajetId, { chauffeurId }, { new: true });
};

agentSchema.methods.confirmerReservation = function (reservationId) {
  const Reservation = mongoose.model("Reservation");
  return Reservation.findByIdAndUpdate(
    reservationId,
    { statut: "confirmee" },
    { new: true }
  );
};

agentSchema.methods.enregistrerPaiement = function (paiementData) {
  const Paiement = mongoose.model("Paiement");
  return new Paiement(paiementData).save();
};

agentSchema.methods.genererModifications = function (trajetId, modifications) {
  const Trajet = mongoose.model("Trajet");
  return Trajet.findByIdAndUpdate(trajetId, modifications, { new: true });
};

const Agent = mongoose.model("Agent", agentSchema);

export default Agent;
