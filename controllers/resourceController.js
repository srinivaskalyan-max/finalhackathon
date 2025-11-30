import { validationResult } from 'express-validator';
import Resource from '../models/Resource.js';

// @desc    Get all resources with search and filter
// @route   GET /api/resources
// @access  Public
export const getAllResources = async (req, res) => {
  try {
    const { search, type, subject, sort } = req.query;
    
    // Build query
    let query = { isActive: true };
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (type) {
      query.type = type;
    }
    
    if (subject) {
      query.subject = { $regex: subject, $options: 'i' };
    }
    
    // Sort options
    let sortOptions = {};
    if (sort === 'latest') {
      sortOptions = { createdAt: -1 };
    } else if (sort === 'oldest') {
      sortOptions = { createdAt: 1 };
    } else if (sort === 'rating') {
      sortOptions = { averageRating: -1 };
    } else if (sort === 'downloads') {
      sortOptions = { downloadCount: -1 };
    } else {
      sortOptions = { createdAt: -1 };
    }
    
    const resources = await Resource.find(query)
      .sort(sortOptions)
      .populate('uploadedBy', 'name email');
    
    // Convert relative file URLs to full URLs
    const resourcesWithFullUrls = resources.map(resource => {
      const resourceObj = resource.toObject();
      if (resourceObj.fileUrl && resourceObj.fileUrl.startsWith('/uploads/')) {
        resourceObj.fileUrl = `http://localhost:${process.env.PORT || 5000}${resourceObj.fileUrl}`;
      }
      return resourceObj;
    });
    
    res.json({
      success: true,
      count: resourcesWithFullUrls.length,
      data: resourcesWithFullUrls
    });
  } catch (error) {
    console.error('Get resources error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching resources',
      error: error.message
    });
  }
};

// @desc    Get single resource by ID
// @route   GET /api/resources/:id
// @access  Public
export const getResourceById = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id)
      .populate('uploadedBy', 'name email')
      .populate('feedback.user', 'name');
    
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }
    
    // Convert relative file URL to full URL
    const resourceObj = resource.toObject();
    if (resourceObj.fileUrl && resourceObj.fileUrl.startsWith('/uploads/')) {
      resourceObj.fileUrl = `http://localhost:${process.env.PORT || 5000}${resourceObj.fileUrl}`;
    }
    
    res.json({
      success: true,
      data: resourceObj
    });
  } catch (error) {
    console.error('Get resource error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching resource',
      error: error.message
    });
  }
};

// @desc    Create new resource
// @route   POST /api/resources
// @access  Private/Admin
export const createResource = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const resourceData = {
      ...req.body,
      uploadedBy: req.user._id,
      uploadedByName: req.user.name
    };
    
    const resource = await Resource.create(resourceData);
    
    // Convert relative file URL to full URL
    const resourceObj = resource.toObject();
    if (resourceObj.fileUrl && resourceObj.fileUrl.startsWith('/uploads/')) {
      resourceObj.fileUrl = `http://localhost:${process.env.PORT || 5000}${resourceObj.fileUrl}`;
    }
    
    res.status(201).json({
      success: true,
      message: 'Resource created successfully',
      data: resourceObj
    });
  } catch (error) {
    console.error('Create resource error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating resource',
      error: error.message
    });
  }
};

// @desc    Update resource
// @route   PUT /api/resources/:id
// @access  Private/Admin
export const updateResource = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    let resource = await Resource.findById(req.params.id);
    
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }
    
    // Update resource
    resource = await Resource.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    // Convert relative file URL to full URL
    const resourceObj = resource.toObject();
    if (resourceObj.fileUrl && resourceObj.fileUrl.startsWith('/uploads/')) {
      resourceObj.fileUrl = `http://localhost:${process.env.PORT || 5000}${resourceObj.fileUrl}`;
    }
    
    res.json({
      success: true,
      message: 'Resource updated successfully',
      data: resourceObj
    });
  } catch (error) {
    console.error('Update resource error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating resource',
      error: error.message
    });
  }
};

// @desc    Delete resource
// @route   DELETE /api/resources/:id
// @access  Private/Admin
export const deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }
    
    // Soft delete - mark as inactive
    resource.isActive = false;
    await resource.save();
    
    // Or hard delete
    // await resource.deleteOne();
    
    res.json({
      success: true,
      message: 'Resource deleted successfully'
    });
  } catch (error) {
    console.error('Delete resource error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting resource',
      error: error.message
    });
  }
};

// @desc    Add feedback to resource
// @route   POST /api/resources/:id/feedback
// @access  Private
export const addFeedback = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const resource = await Resource.findById(req.params.id);
    
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }
    
    // Check if user already gave feedback
    const existingFeedback = resource.feedback.find(
      f => f.user.toString() === req.user._id.toString()
    );
    
    if (existingFeedback) {
      // Update existing feedback
      existingFeedback.rating = req.body.rating;
      existingFeedback.comment = req.body.comment;
    } else {
      // Add new feedback
      resource.feedback.push({
        user: req.user._id,
        userName: req.user.name,
        rating: req.body.rating,
        comment: req.body.comment
      });
    }
    
    // Recalculate average rating
    resource.calculateAverageRating();
    await resource.save();
    
    res.json({
      success: true,
      message: 'Feedback added successfully',
      data: resource
    });
  } catch (error) {
    console.error('Add feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding feedback',
      error: error.message
    });
  }
};

// @desc    Increment download count
// @route   PUT /api/resources/:id/download
// @access  Private
export const incrementDownload = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }
    
    resource.downloadCount += 1;
    await resource.save();
    
    res.json({
      success: true,
      message: 'Download count updated',
      data: resource
    });
  } catch (error) {
    console.error('Increment download error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating download count',
      error: error.message
    });
  }
};
