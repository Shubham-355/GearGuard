const { GoogleGenAI } = require('@google/genai');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

// Initialize Gemini AI client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

/**
 * Send a message to Gemini chatbot
 * @route POST /api/chat
 */
const sendMessage = async (req, res, next) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message || message.trim() === '') {
      throw new ApiError(400, 'Message is required');
    }

    if (!process.env.GEMINI_API_KEY) {
      throw new ApiError(500, 'Gemini API key is not configured');
    }

    // Build the conversation context
    let prompt = message;
    if (conversationHistory.length > 0) {
      const context = conversationHistory
        .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n');
      prompt = `${context}\nUser: ${message}`;
    }

    // Generate response from Gemini
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    const botResponse = response.text;

    res.status(200).json(
      new ApiResponse(200, {
        message: botResponse,
        timestamp: new Date().toISOString()
      }, 'Message sent successfully')
    );
  } catch (error) {
    console.error('Gemini API Error:', error);
    next(new ApiError(500, error.message || 'Failed to get response from chatbot'));
  }
};

/**
 * Stream messages from Gemini chatbot
 * @route POST /api/chat/stream
 */
const streamMessage = async (req, res, next) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message || message.trim() === '') {
      throw new ApiError(400, 'Message is required');
    }

    if (!process.env.GEMINI_API_KEY) {
      throw new ApiError(500, 'Gemini API key is not configured');
    }

    // Set headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Build the conversation context
    let prompt = message;
    if (conversationHistory.length > 0) {
      const context = conversationHistory
        .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n');
      prompt = `${context}\nUser: ${message}`;
    }

    // Generate streaming response from Gemini
    const stream = await ai.models.generateContentStream({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Gemini Streaming Error:', error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
};

module.exports = {
  sendMessage,
  streamMessage
};
