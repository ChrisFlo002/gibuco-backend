import express from "express";
import {
  createPayment,
  modifyStatut,
  getTotalAmountPerPeriod,
  getAmountPerTrajet,
  getAmountToday,
} from "../controllers/payment.controller.js";
import { initiateAfriPay, redirectToAfriPay, afriPayCallback, trackPayment } from "../controllers/afripay.controller.js"

const router = express.Router();

// ***** AfriPay flow *****
router.post("/afripay/initiate", initiateAfriPay);   // returns { redirectUrl, trackId }
router.get("/afripay/redirect", redirectToAfriPay);  // server-side auto-submit to AfriPay
router.post("/afripay/callback", afriPayCallback);   // webhook from AfriPay
router.get("/track/:id", trackPayment);              // poll payment status

// ***** Normal payment endpoints *****
// Create a new payment
router.post("/", createPayment);

// Update payment status
router.patch("/:id/status", modifyStatut);

// Get total amount per period
router.get("/analytics/period", getTotalAmountPerPeriod);

// Get amount per trajet
router.get("/analytics/trajet", getAmountPerTrajet);

// Get today's amount
router.get("/analytics/today", getAmountToday);

export default router;
