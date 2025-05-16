const express = require("express");

module.exports = function(collection) {
  const router = express.Router();

  /* Get the addCar page */
  router.get("/", (request, response) => {
    response.render("addCar");
  });

  /* decode VIN and save to MongoDB */
  router.post("/", async (request, response) => {
    const vin = request.body.vin;
    const url = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vin}?format=json`;

    try {
      const ress = await fetch(url);
      const data = await ress.json();
      const results = data.Results;

      const make = results.find(item => item.Variable === "Make")?.Value || "N/A";
      const model = results.find(item => item.Variable === "Model")?.Value || "N/A";
      const year  = results.find(item => item.Variable === "Model Year")?.Value || "N/A";

      await collection.insertOne({ vin, make, model, year, addedAt: new Date() });

      response.render("confirmation", { vin, make, model, year });
    } catch (error) {
      console.error("Error decoding VIN:", error);
      response.status(500).send("Failed to decode VIN.");
    }
  });

  return router;
};
