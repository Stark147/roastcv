export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { resumeText } = req.body;

  if (!resumeText || resumeText.trim().length < 50) {
    return res.status(400).json({ error: 'Resume text too short' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,  // ← safely stored in Vercel env
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `You are a brutally honest, witty career coach who roasts resumes like a comedy roast but with genuine career advice underneath.

Analyze this resume and respond ONLY with a JSON object (no markdown, no backticks):
{
  "score": <number 1-100>,
  "verdict": <5-7 word brutal verdict like "CHRONICALLY UNEMPLOYABLE" or "BARELY PASSABLE">,
  "verdict_color": <"#ff4500" for bad, "#ff8c00" for mediocre, "#22c55e" for good>,
  "categories": [
    {"label": "Impact", "score": <0-100>},
    {"label": "Clarity", "score": <0-100>},
    {"label": "Keywords", "score": <0-100>},
    {"label": "Formatting", "score": <0-100>},
    {"label": "Originality", "score": <0-100>}
  ],
  "roast": "<3-4 paragraph brutal roast with specific observations from their resume. Be funny, cutting, but accurate. Reference specific things they wrote.>",
  "fixes": "<3-5 specific, actionable bullet points (use • as bullet) on how to actually improve the resume. Be concrete, not generic.>"
}

Resume to roast:
${resumeText.substring(0, 3000)}`
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Anthropic API error');
    }

    const raw = data.content[0].text.replace(/```json|```/g, '').trim();
    const result = JSON.parse(raw);

    return res.status(200).json(result);

  } catch (err) {
    console.error('Roast error:', err);
    return res.status(500).json({ error: 'Failed to roast resume. Try again.' });
  }
}
