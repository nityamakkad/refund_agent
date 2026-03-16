const https = require("https");

module.exports = function(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  const apiKey = process.env.GEMINI_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "GEMINI_KEY not set in environment variables" });
    return;
  }

  let body = "";
  req.on("data", function(chunk) { body += chunk; });
  req.on("end", function() {
    const options = {
      hostname: "generativelanguage.googleapis.com",
      path: "/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body)
      }
    };

    const request = https.request(options, function(response) {
      let data = "";
      response.on("data", function(chunk) { data += chunk; });
      response.on("end", function() {
        res.setHeader("Content-Type", "application/json");
        res.status(200).send(data);
      });
    });

    request.on("error", function(e) {
      res.status(500).json({ error: e.message });
    });

    request.write(body);
    request.end();
  });
};
