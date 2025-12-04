const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

exports.askAI = async (req, res) => {
  try {
    const teacherId = req.user.userId;
    const { query, conversationHistory } = req.body;

    if (!query) {
      return res.status(400).json({ message: 'Query is required' });
    }

    const messages = [
      {
        role: 'system',
        content: 'You are an educational AI assistant helping teachers with their questions. Provide clear, accurate, and helpful responses. Focus on educational topics, teaching methodologies, and subject matter expertise.'
      }
    ];

    if (conversationHistory && Array.isArray(conversationHistory)) {
      messages.push(...conversationHistory);
    }

    messages.push({
      role: 'user',
      content: query
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000
    });

    const aiResponse = completion.choices[0].message.content;

    res.status(200).json({
      query,
      response: aiResponse,
      conversationHistory: [
        ...messages.slice(1),
        {
          role: 'assistant',
          content: aiResponse
        }
      ]
    });
  } catch (error) {
    console.error('AI ask error:', error);
    
    if (error.code === 'insufficient_quota') {
      return res.status(402).json({ 
        message: 'OpenAI API quota exceeded. Please check your billing.' 
      });
    }
    
    if (error.code === 'invalid_api_key') {
      return res.status(401).json({ 
        message: 'Invalid OpenAI API key' 
      });
    }

    res.status(500).json({ message: 'Failed to get AI response' });
  }
};

exports.getAICapabilities = async (req, res) => {
  try {
    res.status(200).json({
      model: 'gpt-4o-mini',
      features: [
        'Multi-turn conversations',
        'Educational assistance',
        'Subject matter expertise',
        'Teaching methodology guidance',
        'Lesson planning support',
        'Question generation',
        'Explanation simplification'
      ],
      capabilities: {
        maxTokens: 1000,
        temperature: 0.7,
        contextRetention: true
      }
    });
  } catch (error) {
    console.error('Get AI capabilities error:', error);
    res.status(500).json({ message: 'Failed to fetch capabilities' });
  }
};