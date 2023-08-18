const express = require("express");
const router = express.Router();

const { processPayment, sendStripeKey } = require('../controllers/paymentController')

const { isAuthenticatedUser } = require("../middlewares/auth")

router.route("/payment/process").post(isAuthenticatedUser, processPayment )
router.route("/stripeapi").get(isAuthenticatedUser, sendStripeKey )


module.exports = router;

//authorize roles for admin specific routes
//isAuthenticatedUser for logged in user