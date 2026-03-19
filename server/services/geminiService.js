const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;
let model = null;

const MODEL_NAME = 'gemini-2.0-flash';

const getModel = () => {
  if (!model) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: MODEL_NAME });
  }
  return model;
};

/**
 * Generate content with retry logic for rate limits
 * Retries up to 3 times with exponential backoff on 429 errors
 */
const generateWithRetry = async (prompt, maxRetries = 3) => {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const ai = getModel();
      const result = await ai.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      lastError = error;
      const is429 = error.status === 429 || error.message?.includes('429');

      if (is429 && attempt < maxRetries) {
        // Wait with exponential backoff: 3s, 6s, 12s
        const waitTime = Math.pow(2, attempt) * 3000;
        console.warn(`Rate limited (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${waitTime / 1000}s...`);
        await new Promise(res => setTimeout(res, waitTime));
        continue;
      }

      if (is429) {
        const err = new Error('AI quota exceeded. Your Gemini API quota has been exhausted. Please wait a minute and try again, or check your API key quota at https://ai.google.dev/gemini-api/docs/rate-limits');
        err.code = 'QUOTA_EXCEEDED';
        throw err;
      }

      // Non-429 errors: throw immediately
      throw error;
    }
  }
  throw lastError;
};

/**
 * Ask a question using document context
 * @param {string} question - User's question
 * @param {string} context - Combined document text
 * @returns {Promise<string>} AI response
 */
const askQuestion = async (question, context) => {
  const prompt = `You are an intelligent learning assistant. Based on the following study material, answer the student's question accurately and clearly. If the answer is not found in the material, say so.

STUDY MATERIAL:
${context.substring(0, 30000)}

STUDENT'S QUESTION:
${question}

Provide a clear, educational answer. Include relevant examples when possible. At the end, mention which topic this question relates to in the format: [Topic: <topic name>]`;

  return await generateWithRetry(prompt);
};

/**
 * Summarize a document
 * @param {string} text - Document text
 * @returns {Promise<string>} Summary
 */
const summarizeDocument = async (text) => {
  const prompt = `Summarize the following study material in a structured way. Use bullet points and organize by topic. Highlight key concepts, formulas, and important terms.

TEXT:
${text.substring(0, 30000)}

Provide:
1. A brief overview (2-3 sentences)
2. Key topics covered
3. Important concepts per topic
4. Key terms and definitions`;

  return await generateWithRetry(prompt);
};

/**
 * Compare two documents
 * @param {string} textA - First document text
 * @param {string} textB - Second document text
 * @param {string} nameA - First document name
 * @param {string} nameB - Second document name
 * @returns {Promise<string>} Comparison result
 */
const compareDocuments = async (textA, textB, nameA, nameB) => {
  const prompt = `You are an intelligent learning assistant. Compare the following two study documents and provide a detailed analysis.

DOCUMENT A (${nameA}):
${textA.substring(0, 15000)}

DOCUMENT B (${nameB}):
${textB.substring(0, 15000)}

Provide:
1. **Common Topics**: Topics covered in both documents
2. **Unique to ${nameA}**: Topics only in Document A
3. **Unique to ${nameB}**: Topics only in Document B
4. **Contradictions**: Any conflicting information between the documents
5. **Complementary Information**: How the documents complement each other
6. **Study Recommendation**: Which document is better for what purpose`;

  return await generateWithRetry(prompt);
};

/**
 * Extract hierarchical topics from text
 * @param {string} text - Document text
 * @returns {Promise<Array>} Array of topics with subtopics
 */
const extractTopics = async (text) => {
  const prompt = `Analyze the following study material and extract all topics and subtopics in a hierarchical structure. Return ONLY a valid JSON array, no other text.

TEXT:
${text.substring(0, 30000)}

Return format (JSON array only, no markdown):
[{"name": "Main Topic 1", "subtopics": ["Subtopic A", "Subtopic B"]}, {"name": "Main Topic 2", "subtopics": ["Subtopic C"]}]`;

  const responseText = await generateWithRetry(prompt);

  // Parse JSON from response (handle markdown code blocks)
  let jsonStr = responseText.trim();
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
  }

  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error('Topic extraction JSON parse error:', e.message);
    // Fallback: try to extract from text
    return [{ name: 'General', subtopics: [] }];
  }
};

/**
 * Generate quiz questions for a topic
 * @param {string} context - Relevant study material
 * @param {string} topic - Topic to generate questions for
 * @param {string} difficulty - easy/medium/hard
 * @param {number} count - Number of questions
 * @returns {Promise<Array>} Array of quiz questions
 */
const generateQuizQuestions = async (context, topic, difficulty = 'medium', count = 5) => {
  const prompt = `You are a quiz generator for educational purposes. Generate ${count} multiple choice questions about "${topic}" at ${difficulty} difficulty level based on this study material.

STUDY MATERIAL:
${context.substring(0, 20000)}

Return ONLY a valid JSON array, no other text. Each question must have exactly 4 options with one correct answer.

Format (JSON array only, no markdown):
[{"question": "What is...?", "options": ["Option A", "Option B", "Option C", "Option D"], "correctAnswer": "Option A", "explanation": "Brief explanation why this is correct"}]`;

  const responseText = await generateWithRetry(prompt);

  let jsonStr = responseText.trim();
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
  }

  try {
    const questions = JSON.parse(jsonStr);
    return questions.map(q => ({
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || ''
    }));
  } catch (e) {
    console.error('Quiz generation JSON parse error:', e.message);
    throw new Error('Failed to generate quiz questions');
  }
};

module.exports = {
  askQuestion,
  summarizeDocument,
  compareDocuments,
  extractTopics,
  generateQuizQuestions
};
