const fs = require('fs');
const path = require('path');
const Document = require('../models/Document');
const { extractTextFromPDF } = require('../services/pdfService');
const { extractTopicsFromText } = require('../services/topicEngine');

// @desc    Upload PDF document
// @route   POST /api/documents/upload
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Extract text from PDF
    const extractedText = await extractTextFromPDF(req.file.path);

    if (!extractedText || extractedText.length === 0) {
      // Clean up file if text extraction failed
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Could not extract text from PDF. The file may be scanned or corrupted.'
      });
    }

    // Extract topics using AI
    let extractedTopics = [];
    try {
      extractedTopics = await extractTopicsFromText(extractedText);
    } catch (topicError) {
      console.error('Topic extraction warning:', topicError.message);
      // Continue without topics — they can be re-extracted later
    }

    const document = await Document.create({
      userId: req.user._id,
      filename: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      extractedText,
      extractedTopics
    });

    res.status(201).json({
      success: true,
      data: {
        id: document._id,
        originalName: document.originalName,
        fileSize: document.fileSize,
        extractedTopics: document.extractedTopics,
        uploadedAt: document.uploadedAt
      }
    });
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file && req.file.path) {
      try { fs.unlinkSync(req.file.path); } catch (e) { /* ignore */ }
    }
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during upload'
    });
  }
};

// @desc    Get all documents for user
// @route   GET /api/documents
exports.getDocuments = async (req, res) => {
  try {
    const documents = await Document.find({ userId: req.user._id })
      .select('-extractedText')
      .sort({ uploadedAt: -1 });

    res.json({
      success: true,
      data: documents
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching documents'
    });
  }
};

// @desc    Get single document
// @route   GET /api/documents/:id
exports.getDocument = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    res.json({
      success: true,
      data: document
    });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching document'
    });
  }
};

// @desc    Delete document
// @route   DELETE /api/documents/:id
exports.deleteDocument = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Delete file from disk
    try {
      if (fs.existsSync(document.filePath)) {
        fs.unlinkSync(document.filePath);
      }
    } catch (fileError) {
      console.error('File deletion warning:', fileError.message);
    }

    await Document.deleteOne({ _id: document._id });

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting document'
    });
  }
};
