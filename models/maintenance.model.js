import mongoose from "mongoose";
import {v4 as uuidv4} from "uuid";

const maintenanceSchema = new mongoose.Schema(
  {
    maintenanceId: {
      type: String,
      required: true,
      unique: true,
      default: () => `MAINTENANCE-${uuidv4()}`,
    },
    description: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    dateFin: {
      type: Date,
      required: true,
    },
    isDone:{
      type: Boolean,
      required:true,
      default: false
    },
    busId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bus",
      required: true,
    },
    prix: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Maintenance = mongoose.model("Maintenance", maintenanceSchema);

export default Maintenance;
