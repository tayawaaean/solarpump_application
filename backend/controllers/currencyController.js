const https = require("https");

exports.getUsdToPhp = (req, res) => {
  const apiKey = process.env.EXCHANGE_API_KEY;
  const options = {
    method: "GET",
    hostname: "v6.exchangerate-api.com",
    port: null,
    path: `/v6/${apiKey}/latest/USD`,
    headers: {
      "content-type": "application/json",
    }
  };

  const reqHttp = https.request(options, function (apiRes) {
    let data = [];
    apiRes.on("data", chunk => data.push(chunk));
    apiRes.on("end", () => {
      try {
        const body = Buffer.concat(data).toString();
        const json = JSON.parse(body);
        if (json.result === "success" && json.conversion_rates && json.conversion_rates.PHP) {
          res.json({ usd_to_php: json.conversion_rates.PHP });
        } else {
          res.status(500).json({ error: "Could not fetch PHP rate", details: json });
        }
      } catch (e) {
        res.status(500).json({ error: "Failed to parse currency API response", details: e.message });
      }
    });
  });

  reqHttp.on("error", (e) => res.status(500).json({ error: "Currency API error", details: e.message }));
  reqHttp.end();
};