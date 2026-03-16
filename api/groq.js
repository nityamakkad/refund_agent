const https = require("https");

module.exports = function(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  const apiKey = process.env.GROQ_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "GROQ_KEY not set in environment variables" });
    return;
  }

  let body = "";
  req.on("data", function(chunk) { body += chunk; });
  req.on("end", function() {
    try {
      // Convert Gemini format to Groq/OpenAI format
      var geminiReq = JSON.parse(body);
      var systemText = "";
      if (geminiReq.system_instruction && geminiReq.system_instruction.parts) {
        systemText = geminiReq.system_instruction.parts[0].text || "";
      }
      var messages = [];
      if (systemText) {
        messages.push({ role: "system", content: systemText });
      }
      if (geminiReq.contents) {
        geminiReq.contents.forEach(function(m) {
          var role = m.role === "model" ? "assistant" : "user";
          var text = m.parts && m.parts[0] ? m.parts[0].text : "";
          messages.push({ role: role, content: text });
        });
      }
      var groqBody = JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: messages,
        max_tokens: 800,
        temperature: 0.5
      });

      var options = {
        hostname: "api.groq.com",
        path: "/openai/v1/chat/completions",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + apiKey,
          "Content-Length": Buffer.byteLength(groqBody)
        }
      };

      var request = https.request(options, function(response) {
        var data = "";
        response.on("data", function(chunk) { data += chunk; });
        response.on("end", function() {
          try {
            var groqRes = JSON.parse(data);
            // Convert Groq response back to Gemini format
            var text = groqRes.choices && groqRes.choices[0]
              ? groqRes.choices[0].message.content
              : (groqRes.error ? groqRes.error.message : "No response");
            var geminiFormat = {
              candidates: [{
                content: { parts: [{ text: text }] }
              }]
            };
            res.setHeader("Content-Type", "application/json");
            res.status(200).json(geminiFormat);
          } catch(e) {
            res.status(500).json({ error: "Parse error: " + e.message });
          }
        });
      });

      request.on("error", function(e) {
        res.status(500).json({ error: e.message });
      });

      request.write(groqBody);
      request.end();

    } catch(e) {
      res.status(500).json({ error: "Request error: " + e.message });
    }
  });
};
