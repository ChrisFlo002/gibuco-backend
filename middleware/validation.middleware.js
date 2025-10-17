export const validateUser = (req, res, next) => {
  const { nom, email, telephone, motDePasse, role } = req.body;

  if (!nom || !email || !telephone || !motDePasse || !role) {
    return res.status(400).json({
      success: false,
      message: "Please provide all required fields",
    });
  }

  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid email",
    });
  }

  next();
};

export const validateTrajet = (req, res, next) => {
  const { villeDepart, villeArrivee, dateDepart, heureDepart, prix, busId } =
    req.body;

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
      message: "Please provide all required fields for trajet",
    });
  }

  next();
};

export const validateReservation = (req, res, next) => {
  const { trajetId, nombrePassagers } = req.body;

  if (!trajetId || !nombrePassagers) {
    return res.status(400).json({
      success: false,
      message: "Please provide trajet ID and number of passengers",
    });
  }

  if (nombrePassagers < 1) {
    return res.status(400).json({
      success: false,
      message: "Number of passengers must be at least 1",
    });
  }

  next();
};

