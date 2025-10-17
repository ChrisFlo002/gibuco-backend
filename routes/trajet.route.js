import express from "express";
import {
  createTrajet,
  clotureTrajet,
  searchTrajet,
  getTrajetsToday,
  getTauxRemplissage,
  modifyPlace,
  getTrajetByBus,
  getTrajetPlusRempli,
  getAllTrajets,
  modifyStatutTrajet,
  getTrajetById,
} from "../controllers/trajet.controller.js";

const router = express.Router();

// Create a new trajet
// POST /api/trajets
router.post("/", createTrajet);

// Search trajets with multiple criteria
// GET /api/trajets/search?villeDepart=Dakar&villeArrivee=Thies&dateDepart=2024-01-15&heureDepart=08:00
router.get("/search", searchTrajet);

// Get all trajets
// GET /api/trajets
router.get("/", getAllTrajets);
// Get today's trajets
// GET /api/trajets/today
router.get("/today", getTrajetsToday);

// Get trajets that are fully booked (most filled)
// GET /api/trajets/plus-remplis?page=1&limit=10
router.get("/plus-remplis", getTrajetPlusRempli);

// Get trajets by bus ID
// GET /api/trajets/bus/:busId?page=1&limit=10&statut=termine
router.get("/bus/:busId", getTrajetByBus);

// Get a specific trajet by ID
// GET /api/trajets/:id
router.get("/:id", getTrajetById);

// Get occupancy rate for a specific trajet
// GET /api/trajets/:id/taux-remplissage
router.get("/:id/taux-remplissage", getTauxRemplissage);

// Close a trajet (clotureTrajet)
// PATCH /api/trajets/:id/cloture
router.put("/cloture/:id", clotureTrajet);

// Modify passenger count
// PATCH /api/trajets/:id/places
router.put("/:id/places", modifyPlace);
//modify statut trajet
router.put("/:id/statut", modifyStatutTrajet);

export default router;