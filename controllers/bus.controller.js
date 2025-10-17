import Bus from "../models/bus.model.js";
import User from "../models/user.model.js"; // Assuming you have a User model

// Create a new bus
export const createBus = async (req, res) => {
  try {
    const { immatriculation, modele, capacite, statut, images, chauffeur, vin } =
      req.body;

    // Validate required fields
    if (!immatriculation || !modele || !capacite || !chauffeur) {
      return res.status(400).json({
        success: false,
        message:
          "Immatriculation, modèle, capacité et chauffeur sont obligatoires",
      });
    }

    // Check if chauffeur exists
    const chauffeurExists = await User.findById(chauffeur);
    if (!chauffeurExists) {
      return res.status(404).json({
        success: false,
        message: "Chauffeur introuvable",
      });
    }

    // Check if immatriculation already exists
    const existingBus = await Bus.findOne({ immatriculation });
    if (existingBus) {
      return res.status(409).json({
        success: false,
        message: "Un bus avec cette immatriculation existe déjà",
      });
    }

    const newBus = new Bus({
      immatriculation,
      modele,
      capacite,
      statut: statut || "disponible",
      images: images || [],
      chauffeur,
      vin:vin || "",
    });

    const savedBus = await newBus.save();

    // Populate chauffeur info in response
    const busWithChauffeur = await Bus.findById(savedBus._id).populate(
      "chauffeur",
      "name email phone"
    );

    res.status(201).json({
      success: true,
      message: "Bus créé avec succès",
      data: busWithChauffeur,
    });
  } catch (error) {
    console.error("Erreur lors de la création du bus:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
      error: error.message,
    });
  }
};

// Modify bus status
export const modifyStatut = async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    // Validate status
    const validStatuses = [
      "disponible",
      "en_service",
      "maintenance",
      "hors_service",
    ];
    if (!statut || !validStatuses.includes(statut)) {
      return res.status(400).json({
        success: false,
        message:
          "Statut invalide. Valeurs acceptées: " + validStatuses.join(", "),
      });
    }

    const bus = await Bus.findById(id);
    if (!bus) {
      return res.status(404).json({
        success: false,
        message: "Bus introuvable",
      });
    }

    bus.statut = statut;
    await bus.save();

    // Return updated bus with chauffeur info
    const updatedBus = await Bus.findById(id).populate(
      "chauffeur",
      "name email phone"
    );

    res.status(200).json({
      success: true,
      message: "Statut du bus modifié avec succès",
      data: updatedBus,
    });
  } catch (error) {
    console.error("Erreur lors de la modification du statut:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
      error: error.message,
    });
  }
};

// Get all buses with chauffeur info
export const getBus = async (req, res) => {
  try {
    // Get all buses
    const buses = await Bus.find()
      .populate("chauffeur", "nom email telephone");

    const total = await Bus.countDocuments();

    res.status(200).json({
      success: true,
      message: "Liste des bus récupérée avec succès",
      data: buses,
      total: total,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des bus:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
      error: error.message,
    });
  }
};

// Get bus by ID with chauffeur info
export const getBusById = async (req, res) => {
  try {
    const { id } = req.params;

    const bus = await Bus.findById(id).populate(
      "chauffeur",
      "name email phone"
    );

    if (!bus) {
      return res.status(404).json({
        success: false,
        message: "Bus introuvable",
      });
    }

    res.status(200).json({
      success: true,
      message: "Bus récupéré avec succès",
      data: bus,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération du bus:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
      error: error.message,
    });
  }
};

//Get bus by chauffeur 
export const getBusByChauffeur = async (req, res) => {
  try {
    const { chauffeur } = req.params;

    const bus = await Bus.find({ chauffeur }).populate(
      "chauffeur",
      "nom email telephone"
    );

    if (!bus) {
      return res.status(404).json({
        success: false,
        message: "Bus introuvable",
      });
    }

    res.status(200).json({
      success: true,
      message: "Bus récupéré avec succès",
      data: bus,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération du bus:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
      error: error.message,
    });
  }
}