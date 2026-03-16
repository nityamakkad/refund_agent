exports.handler = async function(event, context) {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      },
      body: ""
    };
  }

  const GEMINI_API_KEY = process.env.GEMINI_KEY;

  if (!GEMINI_API_KEY) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "API key not configured in Netlify environment variables" })
    };
  }

  try {
    const body = JSON.parse(event.body);
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + GEMINI_API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      }
    );
    const data = await response.json();
    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
      body: JSON.stringify(data)
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: e.message })
    };
  }
};
```

4. Click **Commit changes**

---

## Step 3 — Add Environment Variable in Netlify

1. Netlify → your site → **Site configuration → Environment variables**
2. **Add a variable:**
   - Key: `GEMINI_KEY`
   - Value: your fresh Gemini API key
3. Save

---

## Step 4 — Trigger redeploy

1. Netlify → **Deploys → Trigger deploy → Deploy site**
2. Wait 30 seconds
3. Open your Netlify URL and test!

Your GitHub repo should now have 4 files:
```
refund_agent/
├── index.html
├── README.md
├── netlify.toml
└── netlify/
    └── functions/
        └── gemini.js
