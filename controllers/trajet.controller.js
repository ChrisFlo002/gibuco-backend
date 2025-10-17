import Trajet from "../models/trajet.model.js";
import Bus from "../models/bus.model.js";

// Create a new trajet
export const createTrajet = async (req, res) => {
  try {
    const {
      villeDepart,
      villeArrivee,
      dateDepart,
      heureDepart,
      prix,
      busId,
      distance,
      capacite,
    } = req.body;

    // Validate required fields
    if (
      !villeDepart ||
      !villeArrivee ||
      !dateDepart ||
      !heureDepart ||
      !prix ||
      !busId
    ) {
      return res.status(400).json({
        success: false,
        message: "Tous les champs obligatoires doivent être renseignés",
      });
    }

    // Check if bus exists and is available
    const bus = await Bus.findById(busId);
    if (!bus) {
      return res.status(404).json({
        success: false,
        message: "Bus introuvable",
      });
    }

    if (bus.statut !== "disponible") {
      return res.status(400).json({
        success: false,
        message: "Le bus n'est pas disponible pour ce trajet",
      });
    }

    // Validate departure date (should not be in the past)
    const departureDate = new Date(dateDepart);
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Reset time to compare only dates

    if (departureDate < now) {
      return res.status(400).json({
        success: false,
        message: "La date de départ ne peut pas être dans le passé",
      });
    }

    // Validate price
    if (prix <= 0) {
      return res.status(400).json({
        success: false,
        message: "Le prix doit être supérieur à zéro",
      });
    }

    const newTrajet = new Trajet({
      villeDepart,
      villeArrivee,
      dateDepart: departureDate,
      heureDepart,
      prix,
      busId,
      distance,
      capacite,
    });

    const savedTrajet = await newTrajet.save();

    // Update bus status to "en_service"
    bus.statut = "en_service";
    await bus.save();

    // Populate bus info in response
    const trajetWithBus = await Trajet.findById(savedTrajet._id).populate({
      path: "busId",
      select: "immatriculation modele capacite statut",
      populate: {
        path: "chauffeur",
        select: "nom email telephone",
      },
    });

    res.status(201).json({
      success: true,
      message: "Trajet créé avec succès",
      data: trajetWithBus,
    });
  } catch (error) {
    console.error("Erreur lors de la création du trajet:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
      error: error.message,
    });
  }
};

// Close a trajet (clotureTrajet)
export const clotureTrajet = async (req, res) => {
  try {
    const { id } = req.params;
    const { heureArrivee, passagersArrive, incidents, statut } = req.body;

    // Validate required fields for closure
    if (!heureArrivee || passagersArrive === undefined) {
      return res.status(400).json({
        success: false,
        message:
          "Heure d'arrivée et nombre de passagers arrivés sont obligatoires",
      });
    }

    const trajet = await Trajet.findById(id);
    if (!trajet) {
      return res.status(404).json({
        success: false,
        message: "Trajet introuvable",
      });
    }

    // Check if trajet can be closed
    if (trajet.statut !== "en_cours") {
      return res.status(400).json({
        success: false,
        message: "Seuls les trajets en cours peuvent être clôturés",
      });
    }

    // Validate passenger count
    if (passagersArrive < 0) {
      return res.status(400).json({
        success: false,
        message: "Le nombre de passagers ne peut pas être négatif",
      });
    }

    // Update trajet with closure information
    trajet.heureArrivee = heureArrivee;
    trajet.passagersArrive = passagersArrive;
    trajet.incidents = incidents || "";
    trajet.statut = "termine";

    await trajet.save();

    // Update bus status back to available
    const bus = await Bus.findById(trajet.busId);
    if (bus) {
      bus.statut = "disponible";
      await bus.save();
    }

    // Return updated trajet with bus info
    const updatedTrajet = await Trajet.findById(id).populate({
      path: "busId",
      select: "immatriculation modele capacite statut",
      populate: {
        path: "chauffeur",
        select: "nom email telephone",
      },
    });

    res.status(200).json({
      success: true,
      message: "Trajet clôturé avec succès",
      data: updatedTrajet,
    });
  } catch (error) {
    console.error("Erreur lors de la clôture du trajet:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
      error: error.message,
    });
  }
};

// Search trajets with multiple criteria
export const searchTrajet = async (req, res) => {
  try {
    const {
      villeDepart,
      villeArrivee,
      dateDepart,
      toDate,
      page = 1,
      limit = 10,
    } = req.query;

    // Build search criteria
    const searchCriteria = {};

    if (villeDepart) {
      searchCriteria.villeDepart = { $regex: villeDepart, $options: "i" };
    }

    if (villeArrivee) {
      searchCriteria.villeArrivee = { $regex: villeArrivee, $options: "i" };
    }

    // Handle date range filtering
    if (dateDepart || toDate) {
      const dateFilter = {};

      if (dateDepart && toDate) {
        // Both dates provided - search for trajets within the date range
        const startDate = new Date(dateDepart);
        const endDate = new Date(toDate);

        dateFilter.$gte = new Date(startDate.setHours(0, 0, 0, 0));
        dateFilter.$lte = new Date(endDate.setHours(23, 59, 59, 999));
      } else if (dateDepart) {
        // Only start date provided - search from this date onwards
        const startDate = new Date(dateDepart);
        dateFilter.$gte = new Date(startDate.setHours(0, 0, 0, 0));
      } else if (toDate) {
        // Only end date provided - search up to this date
        const endDate = new Date(toDate);
        dateFilter.$lte = new Date(endDate.setHours(23, 59, 59, 999));
      }

      searchCriteria.dateDepart = dateFilter;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute search query
    const trajets = await Trajet.find(searchCriteria)
      .populate({
        path: "busId",
        select: "immatriculation modele capacite statut",
        populate: {
          path: "chauffeur",
          select: "name email phone",
        },
      })
      .sort({ dateDepart: 1, heureDepart: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Trajet.countDocuments(searchCriteria);

    // Format the search criteria for response (for debugging/logging)
    const formattedSearchCriteria = {
      ...searchCriteria,
      // Convert date objects to readable strings for response
      ...(searchCriteria.dateDepart && {
        dateDepart: {
          ...(searchCriteria.dateDepart.$gte && {
            from: searchCriteria.dateDepart.$gte.toISOString().split("T")[0],
          }),
          ...(searchCriteria.dateDepart.$lte && {
            to: searchCriteria.dateDepart.$lte.toISOString().split("T")[0],
          }),
        },
      }),
    };

    res.status(200).json({
      success: true,
      message: "Recherche effectuée avec succès",
      data: {
        trajets,
        searchCriteria: formattedSearchCriteria,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalTrajets: total,
          hasNext: skip + trajets.length < total,
          hasPrev: parseInt(page) > 1,
        },
      },
    });
  } catch (error) {
    console.error("Erreur lors de la recherche:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
      error: error.message,
    });
  }
};

// Get today's trajets
export const getTrajetsToday = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const trajets = await Trajet.find({
      dateDepart: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    })
      .populate({
        path: "busId",
        select: "immatriculation modele capacite statut",
        populate: {
          path: "chauffeur",
          select: "name email phone",
        },
      })
      .sort({ heureDepart: 1 });

    // Calculate statistics
    const stats = {
      totalTrajets: trajets.length,
      programme: trajets.filter((t) => t.statut === "programme").length,
      enCours: trajets.filter((t) => t.statut === "en_cours").length,
      termine: trajets.filter((t) => t.statut === "termine").length,
      annule: trajets.filter((t) => t.statut === "annule").length,
    };

    res.status(200).json({
      success: true,
      message: "Trajets d'aujourd'hui récupérés avec succès",
      data: {
        trajets,
        statistics: stats,
        date: today.toISOString().split("T")[0],
      },
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des trajets d'aujourd'hui:",
      error
    );
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
      error: error.message,
    });
  }
};
//get all trajets
export const getAllTrajets = async (req, res) => {
  try {
    const trajets = await Trajet.find().populate({
      path: "busId",
      select: "immatriculation modele capacite statut",
      populate: {
        path: "chauffeur",
        select: "nom email telephone",
      },
    });
    res.status(200).json({
      success: true,
      message: "Trajets ",
      data: trajets,
    });
  } catch (error) {
    console.error("Erreur lors de la recherche des trajets:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
      error: error.message,
    });
  }
};

// Get taux de remplissage (occupancy rate)
export const getTauxRemplissage = async (req, res) => {
  try {
    const { id } = req.params;

    const trajet = await Trajet.findById(id).populate(
      "busId",
      "capacite immatriculation modele"
    );

    if (!trajet) {
      return res.status(404).json({
        success: false,
        message: "Trajet introuvable",
      });
    }

    // For this calculation, we need a Reservation model or similar
    // Assuming you have reservations, here's the logic:
    // const reservations = await Reservation.countDocuments({ trajetId: id, statut: 'confirmee' });

    // For now, I'll use passagersArrive as booked places for completed trips
    const busCapacity = trajet.busId.capacite;
    const bookedPlaces =
      trajet.statut === "termine" ? trajet.passagersArrive : 0;
    const availablePlaces = busCapacity - bookedPlaces;
    const occupancyRate =
      busCapacity > 0 ? (bookedPlaces / busCapacity) * 100 : 0;

    res.status(200).json({
      success: true,
      message: "Taux de remplissage calculé avec succès",
      data: {
        trajet: {
          id: trajet._id,
          route: `${trajet.villeDepart} → ${trajet.villeArrivee}`,
          dateDepart: trajet.dateDepart,
          statut: trajet.statut,
        },
        bus: {
          immatriculation: trajet.busId.immatriculation,
          modele: trajet.busId.modele,
          capacite: busCapacity,
        },
        occupancy: {
          placesReservees: bookedPlaces,
          placesDisponibles: availablePlaces,
          capaciteTotal: busCapacity,
          tauxRemplissage: Math.round(occupancyRate * 100) / 100,
        },
      },
    });
  } catch (error) {
    console.error("Erreur lors du calcul du taux de remplissage:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
      error: error.message,
    });
  }
};

// Modify available places (assuming this updates passenger count)
export const modifyPlace = async (req, res) => {
  try {
    const { id } = req.params;
    const { passagersArrive } = req.body;

    if (passagersArrive === undefined || passagersArrive < 0) {
      return res.status(400).json({
        success: false,
        message: "Le nombre de passagers doit être un nombre positif",
      });
    }

    const trajet = await Trajet.findById(id).populate("busId", "capacite");

    if (!trajet) {
      return res.status(404).json({
        success: false,
        message: "Trajet introuvable",
      });
    }

    // Validate passenger count doesn't exceed bus capacity
    if (passagersArrive > trajet.busId.capacite) {
      return res.status(400).json({
        success: false,
        message: `Le nombre de passagers ne peut pas dépasser la capacité du bus (${trajet.busId.capacite})`,
      });
    }

    trajet.passagersArrive = passagersArrive;
    await trajet.save();

    const updatedTrajet = await Trajet.findById(id).populate({
      path: "busId",
      select: "immatriculation modele capacite statut",
      populate: {
        path: "chauffeur",
        select: "name email phone",
      },
    });

    res.status(200).json({
      success: true,
      message: "Nombre de passagers modifié avec succès",
      data: updatedTrajet,
    });
  } catch (error) {
    console.error("Erreur lors de la modification des places:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
      error: error.message,
    });
  }
};
//modify statut trajet
export const modifyStatutTrajet = async (req, res) => {
  const { id } = req.params;
  const { statut } = req.body;
  const trajet = await Trajet.findById(id);
  if (!trajet) {
    return res.status(404).json({
      success: false,
      message: "Trajet introuvable",
    });
  }
  //change statut bus according to staut trajet
  const bus = await Bus.findById(trajet.busId);
  if (statut === "annule" || statut === "termine") {
    bus.statut = "disponible";
    bus.save();
  }

  trajet.statut = statut;
  await trajet.save();
  res.status(200).json({
    success: true,
    message: "Statut du trajet modifié avec successe",
    data: trajet,
  });
};
// Get trajets by bus
export const getTrajetByBus = async (req, res) => {
  try {
    const { busId } = req.params;
    const { page = 1, limit = 10, statut } = req.query;

    // Check if bus exists
    const bus = await Bus.findById(busId);
    if (!bus) {
      return res.status(404).json({
        success: false,
        message: "Bus introuvable",
      });
    }

    // Build filter
    const filter = { busId };
    if (statut) {
      filter.statut = statut;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const trajets = await Trajet.find(filter)
      .populate({
        path: "busId",
        select: "immatriculation modele capacite statut",
        populate: {
          path: "chauffeur",
          select: "name email phone",
        },
      })
      .sort({ dateDepart: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Trajet.countDocuments(filter);

    // Calculate statistics for this bus
    const stats = await Trajet.aggregate([
      { $match: { busId: bus._id } },
      {
        $group: {
          _id: null,
          totalTrajets: { $sum: 1 },
          programme: {
            $sum: { $cond: [{ $eq: ["$statut", "programme"] }, 1, 0] },
          },
          enCours: {
            $sum: { $cond: [{ $eq: ["$statut", "en_cours"] }, 1, 0] },
          },
          termine: { $sum: { $cond: [{ $eq: ["$statut", "termine"] }, 1, 0] } },
          annule: { $sum: { $cond: [{ $eq: ["$statut", "annule"] }, 1, 0] } },
          totalPassagers: { $sum: "$passagersArrive" },
          revenuTotal: { $sum: { $multiply: ["$prix", "$passagersArrive"] } },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      message: "Trajets du bus récupérés avec succès",
      data: {
        trajets,
        bus: {
          id: bus._id,
          immatriculation: bus.immatriculation,
          modele: bus.modele,
          capacite: bus.capacite,
        },
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalTrajets: total,
          hasNext: skip + trajets.length < total,
          hasPrev: parseInt(page) > 1,
        },
        statistics:
          stats.length > 0
            ? stats[0]
            : {
                totalTrajets: 0,
                programme: 0,
                enCours: 0,
                termine: 0,
                annule: 0,
                totalPassagers: 0,
                revenuTotal: 0,
              },
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des trajets du bus:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
      error: error.message,
    });
  }
};

// Get trajets that are fully booked (places = 0)
export const getTrajetPlusRempli = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    // This query finds trajets where passagersArrive equals bus capacity
    const pipeline = [
      {
        $lookup: {
          from: "buses",
          localField: "busId",
          foreignField: "_id",
          as: "bus",
        },
      },
      {
        $unwind: "$bus",
      },
      {
        $match: {
          $expr: { $gte: ["$passagersArrive", "$bus.capacite"] },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "bus.chauffeur",
          foreignField: "_id",
          as: "bus.chauffeur",
        },
      },
      {
        $unwind: "$bus.chauffeur",
      },
      {
        $project: {
          villeDepart: 1,
          villeArrivee: 1,
          dateDepart: 1,
          heureDepart: 1,
          heureArrivee: 1,
          prix: 1,
          passagersArrive: 1,
          statut: 1,
          incidents: 1,
          createdAt: 1,
          updatedAt: 1,
          "bus._id": 1,
          "bus.immatriculation": 1,
          "bus.modele": 1,
          "bus.capacite": 1,
          "bus.statut": 1,
          "bus.chauffeur.name": 1,
          "bus.chauffeur.email": 1,
          "bus.chauffeur.phone": 1,
        },
      },
      {
        $sort: { dateDepart: -1 },
      },
    ];

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const trajetsRemplis = await Trajet.aggregate([
      ...pipeline,
      { $skip: skip },
      { $limit: parseInt(limit) },
    ]);

    const totalPipeline = [
      ...pipeline.slice(0, -1), // Remove sort stage
      { $count: "total" },
    ];

    const totalResult = await Trajet.aggregate(totalPipeline);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;

    // Calculate additional statistics
    const stats = await Trajet.aggregate([
      ...pipeline.slice(0, -1), // Remove sort stage
      {
        $group: {
          _id: null,
          totalTrajetsRemplis: { $sum: 1 },
          totalPassagers: { $sum: "$passagersArrive" },
          revenuTotal: { $sum: { $multiply: ["$prix", "$passagersArrive"] } },
          moyennePassagers: { $avg: "$passagersArrive" },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      message: "Trajets les plus remplis récupérés avec succès",
      data: {
        trajets: trajetsRemplis,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalTrajets: total,
          hasNext: skip + trajetsRemplis.length < total,
          hasPrev: parseInt(page) > 1,
        },
        statistics:
          stats.length > 0
            ? stats[0]
            : {
                totalTrajetsRemplis: 0,
                totalPassagers: 0,
                revenuTotal: 0,
                moyennePassagers: 0,
              },
      },
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des trajets les plus remplis:",
      error
    );
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
      error: error.message,
    });
  }
};

//Get trajet by ID
export const getTrajetById = async (req, res) => {
  try {
    const { id } = req.params;


    const trajet = await Trajet.findById(id).populate({
      path: "busId",
      select: "immatriculation modele capacite ",
      populate: {
        path: "chauffeur",
        select: "nom",
      },
    })

    if (!trajet) {
      return res.status(404).json({
        success: false,
        message: "Urugendo rwabuze",
      });
    }

    res.status(200).json({
      success: true,
      message: "Trajet récupéré avec succès",
      data: trajet,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
      error: error.message,
    });
  }
}