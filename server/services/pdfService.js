const fs = require('fs');
const pdfParse = require('pdf-parse');

/**
 * Extract text content from a PDF file
 * @param {string} filePath - Path to the PDF file
 * @returns {Promise<string>} Extracted text content
 */
const extractTextFromPDF = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const result = await pdfParse(dataBuffer);
    return result.text.trim();
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF');
  }
};

/**
 * Get PDF metadata
 * @param {string} filePath - Path to the PDF file
 * @returns {Promise<Object>} PDF metadata
 */
const getPDFMetadata = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const result = await pdfParse(dataBuffer);
    return {
      pages: result.numpages,
      textLength: result.text.length
    };
  } catch (error) {
    console.error('PDF metadata error:', error);
    throw new Error('Failed to read PDF metadata');
  }
};

module.exports = { extractTextFromPDF, getPDFMetadata };
