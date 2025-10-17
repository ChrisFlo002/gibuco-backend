import mongoose from "mongoose";

const administrateurSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

const Administrateur = mongoose.model("Administrateur", administrateurSchema);
export default Administrateur;
