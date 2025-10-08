const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

const HF_TOKEN = process.env.HF_TOKEN || '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';

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Aviato Backend API is running!',
    timestamp: new Date().toISOString()
  });
});

app.post('/generate', async (req, res) => {
  try {
    const { prompt, negative_prompt, steps, cfg, seed, width, height } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    console.log('🎨 Generating image:', prompt.substring(0, 50) + '...');

    const response = await fetch(
      'https://api-inference.huggingface.co/models/Heartsync/Hentai-Adult',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            negative_prompt: negative_prompt || 'low quality, blurry, distorted',
            num_inference_steps: steps || 25,
            guidance_scale: cfg || 7,
            width: width || 1024,
            height: height || 1024,
            seed: seed === -1 ? Math.floor(Math.random() * 1000000) : seed
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ HF API Error:', errorText);
      
      if (response.status === 503) {
        return res.status(503).json({ 
          error: 'Model is loading',
          message: 'The AI model is starting up. Please wait 20 seconds and try again.',
          retry: true
        });
      }
      
      return res.status(response.status).json({ 
        error: `API error: ${response.status}`,
        details: errorText
      });
    }

    const imageBuffer = await response.buffer();
    const base64Image = imageBuffer.toString('base64');
    const dataUrl = `data:image/png;base64,${base64Image}`;

    console.log('✅ Image generated successfully!');

    res.json({ 
      success: true, 
      image: dataUrl,
      message: 'Image generated successfully'
    });

  } catch (error) {
    console.error('❌ Server error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Aviato Backend running on port ${PORT}`);
  console.log(`🌐 Access at: http://localhost:${PORT}`);
});
