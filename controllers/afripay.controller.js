import Payment from "../models/payment.model.js";
import Reservation from "../models/reservation.model.js";
import Trajet from "../models/trajet.model.js";
import crypto from "crypto";

/**
 * REQUIRED ENV VARS (Render dashboard):
 * - AFRIPAY_APP_ID=xxxxxxxx
 * - AFRIPAY_APP_SECRET=xxxxxxxx
 * - AFRIPAY_CHECKOUT_URL=https://www.afripay.africa/checkout/index.php
 * - PUBLIC_RETURN_URL=http://localhost:5173/payment/processing   // local frontend page
 * - BASE_URL=https://<your-render>.onrender.com                   // your Render backend base
 *
 * NOTE: Secrets are ONLY used server-side. The browser never sees AFRIPAY_APP_SECRET.
 */

// Helper to build hidden inputs
//const hiddenInput = (name, value) => `<input type="hidden" name="${name}" value="${String(value)}" />`;

// POST /api/payments/afripay/initiate
// 1) Create a pending Payment
// 2) Return { redirectUrl, trackId } — front-end then navigates to redirectUrl
export const initiateAfriPay = async (req, res) => {
  try {
    const { reservationId, amount, currency } = req.body || {};

    if (!reservationId || !amount) {
      return res.status(400).json({ success: false, message: "reservationId and amount are required" });
    }

    const reservation = await Reservation.findById(reservationId);
    if (!reservation) return res.status(404).json({ success: false, message: "Réservation non trouvée" });

    const pending = await Payment.create({
      reservationId,
      montant: Number(amount),
      methodePaiement: "AfriPay",
      statut: "en_attente",
      datePaiement: new Date(),
    });

    const redirectUrl = `${process.env.BASE_URL}/api/payments/afripay/redirect?pid=${pending._id}`;
    return res.json({ success: true, redirectUrl, trackId: String(pending._id) });
  } catch (err) {
    console.error("InitiateAfriPay error:", err);
    return res.status(500).json({ success: false, message: "Initiation de paiement Afripay echouee", error: err.message });
  }
};

// GET /api/payments/afripay/redirect?pid=...
// Renders a minimal HTML page that auto-submits an AfriPay form from the SERVER (secret never hits JS bundle).
export const redirectToAfriPay = async (req, res) => {
  try {
    const { pid } = req.query;
    const payment = await Payment.findById(pid);
    if (!payment) return res.status(404).send("Paiement introuvable.");

    const amount = 500; //for testing purposes only, to be replaced with payment.montant
    const currency = "BIF";
    const client_token = pid;//sending reservation id for a better fetch later on of the payment
    const comment = `reservation:${payment.reservationId};payment:${payment._id}`;

    const formFields = {
      amount,
      currency,
      client_token,
      comment,
      app_id: process.env.AFRIPAY_APP_ID,
      app_secret: process.env.AFRIPAY_APP_SECRET, // stays on server-rendered HTML
      return_url: process.env.PUBLIC_RETURN_URL,  // browser will go here after OTP
      callback_url: `${process.env.BASE_URL}/api/payments/afripay/callback`, // webhook to this backend
    };
    // --- CSP nonce + header ---
    const nonce = crypto.randomBytes(16).toString("base64");
    // Allow our own inline script (via nonce) and allow posting the form to Afripay
    res.set("Content-Security-Policy", [
      "default-src 'self'",
      "base-uri 'none'",
      "frame-ancestors 'none'",
      "connect-src 'self'",
      `script-src 'self' 'nonce-${nonce}'`,
      `form-action 'self' ${new URL(process.env.AFRIPAY_CHECKOUT_URL).origin}`,
    ].join("; "));

    const hiddenInput = (n, v) => `<input type="hidden" name="${n}" value="${String(v)}" />`;

    const html = `<!doctype html>
<html>
<head><meta charset="utf-8"><title>Redirecting to AfriPay…</title></head>
<body style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, 'Helvetica Neue', Arial;">
  <div style="max-width:560px;margin:64px auto;padding:24px;border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,0.08)">
    <h1 style="font-size:20px;margin:0 0 12px">Redirecting to AfriPay…</h1>
    <p style="opacity:.8;margin:0 0 8px">Please wait while we open the secure payment page.</p>
    <form id="afripayForm" method="post" action="${process.env.AFRIPAY_CHECKOUT_URL}">
      ${Object.entries(formFields).map(([k, v]) => hiddenInput(k, v)).join("\n")}
      <noscript><button type="submit" style="padding:10px 16px;border-radius:10px;border:0">Continue</button></noscript>
    </form>
  </div>
  <script nonce="${nonce}">document.getElementById('afripayForm').submit();</script>
</body>
</html>`;

    res.set("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(html);
  } catch (err) {
    console.error("redirectToAfriPay error:", err);
    return res.status(500).send("Unable to redirect to AfriPay.");
  }
};

// POST /api/payments/afripay/callback
// AfriPay -> this backend. Updates DB to complete/échoué, adjusts reservation + seats.
export const afriPayCallback = async (req, res) => {
  try {
    const { status, amount, currency, transaction_ref, payment_method, client_token } = req.body || {};

    if (!status) return res.status(400).json({ success: false, message: "Missing status" });

    // NOTE: If AfriPay provides a signature header, verify here with AFRIPAY_APP_SECRET.
    // Skipped because spec not provided.

    const payment = await Payment.findOne({
      _id: client_token,
    }).populate({ path: "reservationId", populate: { path: "trajetId" } });

    if (!payment) {
      // Gracefully ack to avoid retries; optionally log for investigation.
      console.warn("AfriPay callback: matching pending payment not found.");
      return res.status(200).json({ success: true, message: "Paiement non trouve et Afripay reussi." });
    }

    if (status === "success") {
      payment.statut = "complete";
      payment.transactionRef = transaction_ref;
      //payment.paymentMethodDetail = payment_method;
      await payment.save();

      // Confirm reservation & decrement seats
      const reservation = payment.reservationId;
      const trajet = reservation?.trajetId;
      if (reservation) {
        reservation.statut = "confirmee"; // align with existing success path
        await reservation.save();
      }
      if (trajet && reservation?.nombrePassagers != null) {
        if (trajet.capacite == null) trajet.capacite = 0;
        const ncap = trajet.capacite - reservation.nombrePassagers;
        trajet.capacite = ncap;
        await trajet.save();
      }
    } else {
      payment.statut = "echoue";
      payment.transactionRef = transaction_ref;
      //payment.paymentMethodDetail = payment_method;
      await payment.save();
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("afriPayCallback error:", err);
    return res.status(500).json({ success: false, message: "Callback handling error", error: err.message });
  }
};

// GET /api/payments/track/:id
// Frontend polling or manual check: returns { status: pending|success|error }
export const trackPayment = async (req, res) => {
  try {
    const p = await Payment.findById(req.params.id).select("statut");
    if (!p) return res.status(404).json({ status: "error", message: "Not found" });

    const status =
      p.statut === "complete" ? "success" :
        p.statut === "echoue" ? "error" :
          "pending";

    return res.json({ status });
  } catch (err) {
    return res.status(500).json({ status: "error", message: err.message });
  }
};
