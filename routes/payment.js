const express = require("express");
const router = express.Router();
const stripe = require("stripe")("sk_test_51KUxgSEOBrmHhbhzfZjjIHfMtTuxtD1MVW0hpYZcqttc8DYoDs0dGKWNmVcAdpi7hP5wO6SNxkrugUVCpH6Q9lkd00tSmHCMWm");

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