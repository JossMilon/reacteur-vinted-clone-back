const express = require("express");
const formidable = require("express-formidable");
const cloudinary = require("cloudinary").v2;
const router = express.Router();

//Import des modèles nécessaires
const Offer = require("../models/Offer");

//Import des middlewares
const isAuthenticated = require("../middlewares/isAuthenticated");

router.post("/offer/publish", isAuthenticated, async (req, res) => {
  try {
    const { title, description, price, condition, city, brand, size, color } =
      req.fields;
    const newOffer = new Offer({
      product_name: title,
      product_description: description,
      product_price: Number(price),
      product_details: [
        {
          MARQUE: brand,
        },
        {
          TAILLE: size,
        },
        {
          ÉTAT: condition,
        },
        {
          COULEUR: color,
        },
        {
          EMPLACEMENT: city,
        },
      ],
      owner: req.user,
    });

    //Uploading the image in a folder named after offer ID
    const imageFolderId = newOffer.id;
    const imageToSave = req.files.picture.path;
    const result = await cloudinary.uploader.upload(imageToSave, {
      folder: `vinted/offers/${imageFolderId}`,
    });
    newOffer.product_image = result;
    await newOffer.save();
    res.status(200).json(newOffer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/offers", async (req, res) => {
  try {
    //Building the filtering system
    const filters = {};
    if (req.query.title) {
      filters.product_name = new RegExp(req.query.title, "i");
    }
    if (req.query.priceMin) {
      filters.product_price = { $gte: req.query.priceMin };
    }
    if (req.query.priceMax) {
      if (req.query.priceMin) {
        filters.product_price = {
          $gte: req.query.priceMin,
          $lte: req.query.priceMax,
        };
      } else {
        filters.product_price = { $lte: req.query.priceMax };
      }
    }

    //Building the sorting system
    const sorting = {};
    if (req.query.sort) {
      let sortType = req.query.sort.replace("price-", "");
      sorting.product_price = sortType;
    }

    //Build the pagination system
    let maxOffersPerPage = Number(req.query.limit);
    if (!maxOffersPerPage) {
      maxOffersPerPage = 10;
    }
    let pageToSkip;
    if (Number(req.query.page) < 1 || !req.query.page) {
      pageToSkip = 1;
    } else {
      pageToSkip = (Number(req.query.page) - 1) * maxOffersPerPage;
    }

    const offersFound = await Offer.find(filters)
      .sort(sorting)
      .limit(maxOffersPerPage)
      .skip(pageToSkip)
      .populate({
        path: "owner",
        select: "account id",
      });
    const countOffers = await Offer.countDocuments(filters);
    res.status(200).json({
      count: countOffers,
      offers: offersFound,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/offer/:id", async (req, res) => {
  try {
    const offerFound = await Offer.findById(req.params.id).populate({
      path: "owner",
      select: "account id",
    });
    res.status(200).json(offerFound);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
