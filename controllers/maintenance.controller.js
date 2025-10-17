import Maintenance from "../models/maintenance.model.js";
import Bus from "../models/bus.model.js";

// Create a new maintenance
export const createMaintenance = async (req, res) => {
  try {
    const { description, date, dateFin, busId, prix } = req.body;

    // Validate required fields
    if (!description || !date || !dateFin || !busId || prix === undefined) {
      return res.status(400).json({
        success: false,
        message:
          "Description, date, date de fin, bus ID et prix sont obligatoires",
      });
    }

    // Validate dates
    const startDate = new Date(date);
    const endDate = new Date(dateFin);
    const now = new Date();

    if (startDate < now) {
      return res.status(400).json({
        success: false,
        message: "La date de début ne peut pas être dans le passé",
      });
    }

    if (endDate <= startDate) {
      return res.status(400).json({
        success: false,
        message: "La date de fin doit être postérieure à la date de début",
      });
    }

    // Check if bus exists
    const bus = await Bus.findById(busId);
    if (!bus) {
      return res.status(404).json({
        success: false,
        message: "Bus introuvable",
      });
    }

    // Validate price
    if (prix < 0) {
      return res.status(400).json({
        success: false,
        message: "Le prix ne peut pas être négatif",
      });
    }

    const newMaintenance = new Maintenance({
      description,
      date: startDate,
      dateFin: endDate,
      busId,
      prix,
    });

    bus.statut = "maintenance";
    await bus.save();
    const savedMaintenance = await newMaintenance.save();

    // Populate bus info in response
    const maintenanceWithBus = await Maintenance.findById(
      savedMaintenance._id
    ).populate({
      path: "busId",
      select: "immatriculation modele capacite statut",
      populate: {
        path: "chauffeur",
        select: "nom email telephone",
      },
    });

    res.status(201).json({
      success: true,
      message: "Maintenance créée avec succès",
      data: maintenanceWithBus,
    });
  } catch (error) {
    console.error("Erreur lors de la création de la maintenance:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
      error: error.message,
    });
  }
};

// Get maintenances by bus ID
export const getMaintenancesByBus = async (req, res) => {
  try {
    const { busId } = req.params;
    const { page = 1, limit = 10, isDone } = req.query;

    // Check if bus exists
    const bus = await Bus.findById(busId);
    if (!bus) {
      return res.status(404).json({
        success: false,
        message: "Bus introuvable",
      });
    }

    // Build filter object
    const filter = { busId };
    if (isDone !== undefined) {
      filter.isDone = isDone === "true";
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const maintenances = await Maintenance.find(filter)
      .populate({
        path: "busId",
        select: "immatriculation modele capacite statut",
        populate: {
          path: "chauffeur",
          select: "nom email telephone",
        },
      })
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Maintenance.countDocuments(filter);

    // Calculate maintenance statistics
    const stats = await Maintenance.aggregate([
      { $match: { busId: bus._id } },
      {
        $group: {
          _id: null,
          totalMaintenances: { $sum: 1 },
          completedMaintenances: {
            $sum: { $cond: [{ $eq: ["$isDone", true] }, 1, 0] },
          },
          pendingMaintenances: {
            $sum: { $cond: [{ $eq: ["$isDone", false] }, 1, 0] },
          },
          totalCost: { $sum: "$prix" },
          averageCost: { $avg: "$prix" },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      message: "Maintenances récupérées avec succès",
      data: {
        maintenances,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalMaintenances: total,
          hasNext: skip + maintenances.length < total,
          hasPrev: parseInt(page) > 1,
        },
        statistics:
          stats.length > 0
            ? stats[0]
            : {
                totalMaintenances: 0,
                completedMaintenances: 0,
                pendingMaintenances: 0,
                totalCost: 0,
                averageCost: 0,
              },
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des maintenances:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
      error: error.message,
    });
  }
};

// Modify maintenance status
export const modifyMaintenanceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isDone } = req.body;

    // Validate isDone field
    if (typeof isDone !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Le champ isDone doit être un booléen (true ou false)",
      });
    }

    const maintenance = await Maintenance.findById(id);
    if (!maintenance) {
      return res.status(404).json({
        success: false,
        message: "Maintenance introuvable",
      });
    }

    // Check if trying to mark as done but end date hasn't passed
    if (isDone && new Date() > maintenance.dateFin) {
      maintenance.dateFin = new Date();
    }

    maintenance.isDone = isDone;
    await maintenance.save();

    // If maintenance is completed, optionally update bus status
    if (isDone) {
      const bus = await Bus.findById(maintenance.busId);
      if (bus && bus.statut === "maintenance") {
        // Check if there are other pending maintenances
        const pendingMaintenances = await Maintenance.countDocuments({
          busId: maintenance.busId,
          isDone: false,
          _id: { $ne: maintenance._id },
        });

        // If no other pending maintenances, set bus status back to available
        if (pendingMaintenances === 0) {
          bus.statut = "disponible";
          await bus.save();
        }
      }
    } else {
      // If marking as not done, ensure bus is in maintenance status
      const bus = await Bus.findById(maintenance.busId);
      if (bus && bus.statut !== "maintenance") {
        bus.statut = "maintenance";
        await bus.save();
      }
    }

    // Return updated maintenance with bus info
    const updatedMaintenance = await Maintenance.findById(id).populate({
      path: "busId",
      select: "immatriculation modele capacite statut",
      populate: {
        path: "chauffeur",
        select: "nom email telephone",
      },
    });

    res.status(200).json({
      success: true,
      message: `Maintenance ${
        isDone ? "marquée comme terminée" : "marquée comme en cours"
      }`,
      data: updatedMaintenance,
    });
  } catch (error) {
    console.error(
      "Erreur lors de la modification du statut de la maintenance:",
      error
    );
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
      error: error.message,
    });
  }
};
