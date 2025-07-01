const https = require("https");
const FuelPrice = require('../models/FuelPrice');

// Helper to fetch CollectAPI price
function fetchAndFilter(path, callback) {
  const options = {
    method: "GET",
    hostname: "api.collectapi.com",
    port: null,
    path,
    headers: {
      "content-type": "application/json",
      "authorization": "apikey " + process.env.COLLECTAPI_KEY
    }
  };
  const req = https.request(options, function (res) {
    let data = [];
    res.on("data", chunk => data.push(chunk));
    res.on("end", () => {
      try {
        const body = Buffer.concat(data).toString();
        const json = JSON.parse(body);
        const result = json.results?.find(item => item.country === "Philippines");
        if (result) callback(null, result);
        else callback(new Error("No Philippines price found"), null);
      } catch (e) {
        callback(e, null);
      }
    });
  });
  req.on("error", (e) => callback(e, null));
  req.end();
}

// GET price (with possible override)
async function getFuelPrice(type, apiPath, res) {
  try {
    // Check for custom override
    const custom = await FuelPrice.findOne({ type });
    if (custom) {
      return res.json({
        country: "Philippines",
        price: custom.price.toString(),
        currency: "usd",
        source: "custom"
      });
    }
    // Else, fetch from CollectAPI
    fetchAndFilter(apiPath, (err, apiResult) => {
      if (err) return res.status(404).json({ error: "Not found", details: err.message });
      res.json({ ...apiResult, source: "collectapi" });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// PATCH/POST to update
exports.updateFuelPrice = async (req, res) => {
  const { type, price } = req.body;
  if (!['gasoline', 'diesel'].includes(type) || typeof price !== 'number') {
    return res.status(400).json({ error: 'Invalid type or price' });
  }
  try {
    const updated = await FuelPrice.findOneAndUpdate(
      { type },
      { price, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPhilippinesGasoline = (req, res) =>
  getFuelPrice('gasoline', "/gasPrice/otherCountriesGasoline", res);

exports.getPhilippinesDiesel = (req, res) =>
  getFuelPrice('diesel', "/gasPrice/otherCountriesDiesel", res);