const https = require("https");

exports.handler = function(event, context, callback) {
  var headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return callback(null, { statusCode: 200, headers: headers, body: "" });
  }

  var apiKey = process.env.GEMINI_KEY;
  if (!apiKey) {
    return callback(null, {
      statusCode: 500,
      headers: headers,
      body: JSON.stringify({ error: "GEMINI_KEY environment variable not set" })
    });
  }

  var requestBody = event.body;
  var options = {
    hostname: "generativelanguage.googleapis.com",
    path: "/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(requestBody)
    }
  };

  var req = https.request(options, function(res) {
    var data = "";
    res.on("data", function(chunk) { data += chunk; });
    res.on("end", function() {
      callback(null, {
        statusCode: 200,
        headers: headers,
        body: data
      });
    });
  });

  req.on("error", function(e) {
    callback(null, {
      statusCode: 500,
      headers: headers,
      body: JSON.stringify({ error: e.message })
    });
  });

  req.write(requestBody);
  req.end();
};
