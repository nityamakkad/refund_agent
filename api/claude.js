export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "OPENAI_API_KEY not set in environment variables" });
  }

  try {
    const { system, messages } = req.body;

    // Convert to OpenAI format — system prompt as first message
    const openAIMessages = [
      { role: "system", content: system },
      ...messages.map(function(m) {
        return {
          role: m.role === "assistant" ? "assistant" : "user",
          content: typeof m.content === "string" ? m.content : (m.content[0] || {}).text || ""
        };
      })
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + apiKey
      },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: 1024,
        temperature: 0.3,
        messages: openAIMessages
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error || "OpenAI API error" });
    }

    // Return in same format as Claude API so index.html works unchanged
    return res.status(200).json({
      content: [
        { type: "text", text: data.choices[0].message.content }
      ]
    });

  } catch (err) {
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
