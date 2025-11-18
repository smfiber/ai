// api/generate-image.js

export default async function handler(request, response) {
  // 1. Get the prompt from the browser's request
  // We use request.body, and expect a JSON like { "prompt": "..." }
  
  // Vercel parses the body, but if it's a string, we need to parse it.
  let body;
  if (typeof request.body === 'string') {
    try {
      body = JSON.parse(request.body);
    } catch (error) {
      return response.status(400).json({ error: 'Invalid JSON in request body' });
    }
  } else {
    body = request.body;
  }

  const { prompt } = body;

  if (!prompt) {
    return response.status(400).json({ error: 'Prompt is required' });
  }

  // 2. Get your secret API key from Environment Variables
  // Vercel uses process.env.YOUR_VARIABLE_NAME
  const apiKey = process.env.VITE_IMAGEN_API_KEY;

  if (!apiKey) {
    return response.status(500).json({ error: 'API key not configured on server' });
  }

  // 3. This is the same Google API call you had before
  const apiUrl = `https://generativelanguage.googleapis.com/v1/models/imagen-3.2-preview-002:generateImages?key=${apiKey}`;
  const payload = { "prompt": prompt, "sampleCount": 1 };

  try {
    // 4. Call Google from the server
    const apiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error("Google API Error:", errorText);
      return response.status(apiResponse.status).json({ error: `API request failed: ${errorText}` });
    }

    const result = await apiResponse.json();

    // 5. Send the successful result back to your browser
    return response.status(200).json(result);

  } catch (error) {
    console.error("Server Error:", error.message);
    return response.status(500).json({ error: `Server error: ${error.message}` });
  }
}
