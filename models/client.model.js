import mongoose from "mongoose";
import User from "./user.model.js";

const clientSchema = new mongoose.Schema({
  pointsFidelite: {
    type: Number,
    default: 0,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});


const Client = mongoose.model("Client", clientSchema);

export default Client
