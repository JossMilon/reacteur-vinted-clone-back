const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.SPENDESK_SECRET);

router.post("/payment", async (req, res) => {
    try {
        const {amount, description, stripeToken} = req.fields;
        const response = await stripe.charges.create({
            "amount": amount,
            "description": description,
            "currency": "eur",
            "source": stripeToken,
        });
        res.status(200).json(response);
    }
    catch(error) {
        res.status(400).json({error: error.message});
    }
});

module.exports = router;