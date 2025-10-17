import Agency from "../models/agency.model.js";

// @desc    Create new agency
// @route   POST /api/agencies
// @access  Private (Admin)
export const createAgency = async (req, res) => {
  try {
    const { nom, ville, adresse, telephone, province, chef } = req.body;

    // Check if all required fields are provided
    if (!nom || !ville || !adresse || !telephone || !province) {
      return res.status(400).json({
        success: false,
        message: "Veuillez fournir tous les champs requis: nom, ville, adresse, telephone, province",
      });
    }

    // Check if agency with same name and address already exists
    const existingAgency = await Agency.findOne({
      nom: nom.trim(),
      adresse: adresse.trim(),
    });

    if (existingAgency) {
      return res.status(400).json({
        success: false,
        message: "Une agence avec ce nom et cette adresse existe déjà",
      });
    }

    // Create new agency
    const agency = new Agency({
      nom: nom.trim(),
      ville: ville.trim(),
      adresse: adresse.trim(),
      telephone: telephone.trim(),
      province: province.trim(),
      chef: chef,
    });

    await agency.save();

    res.status(201).json({
      success: true,
      message: "Agence créée avec succès",
      data: agency,
    });
  } catch (error) {
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Une agence avec ces informations existe déjà",
      });
    }

    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

// @desc    Get all agencies
// @route   GET /api/agencies
// @access  Private
export const getAgencies = async (req, res) => {
  try {

    // Build filter object
   /* const filter = {};
    if (ville) {
      filter.ville = { $regex: ville, $options: "i" }; // Case-insensitive search
    }
    if (province) {
      filter.province = { $regex: province, $options: "i" }; // Case-insensitive search
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);*/

    const agencies = await Agency.find()
      .populate({
        path: "chef",
        select: "userId nom email telephone role statut",
      });

    res.status(200).json({
      success: true,
      message: "Agences récupérées avec succès",
      data: agencies,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

// @desc    Get agency by ID
// @route   GET /api/agencies/:id
// @access  Private
export const getAgencyById = async (req, res) => {
  try {
    const { id } = req.params;

    const agency = await Agency.findById(id);

    if (!agency) {
      return res.status(404).json({
        success: false,
        message: "Agence non trouvée",
      });
    }

    res.status(200).json({
      success: true,
      message: "Agence récupérée avec succès",
      data: agency,
    });
  } catch (error) {
    // Handle invalid ObjectId
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "ID agence invalide",
      });
    }

    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

// @desc    Update agency
// @route   PUT /api/agencies/:id
// @access  Private (Admin)
export const updateAgency = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, ville, adresse, telephone, province } = req.body;

    const agency = await Agency.findById(id);

    if (!agency) {
      return res.status(404).json({
        success: false,
        message: "Agence non trouvée",
      });
    }

    // Update fields if provided
    if (nom) agency.nom = nom.trim();
    if (ville) agency.ville = ville.trim();
    if (adresse) agency.adresse = adresse.trim();
    if (telephone) agency.telephone = telephone.trim();
    if (province) agency.province = province.trim();

    await agency.save();

    res.status(200).json({
      success: true,
      message: "Agence mise à jour avec succès",
      data: agency,
    });
  } catch (error) {
    // Handle invalid ObjectId
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "ID agence invalide",
      });
    }

    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

// @desc    Delete agency
// @route   DELETE /api/agencies/:id
// @access  Private (Admin)
export const deleteAgency = async (req, res) => {
  try {
    const { id } = req.params;

    const agency = await Agency.findById(id);

    if (!agency) {
      return res.status(404).json({
        success: false,
        message: "Agence non trouvée",
      });
    }

    await Agency.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Agence supprimée avec succès",
    });
  } catch (error) {
    // Handle invalid ObjectId
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "ID agence invalide",
      });
    }

    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
};