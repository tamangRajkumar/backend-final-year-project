import mongoose from "mongoose";
import Event from "../models/event.js";
import User from "../models/user.js";

// Create a new event
export const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      eventType,
      location,
      startDate,
      endDate,
      startTime,
      endTime,
      maxAttendees,
      registrationFee,
      currency,
      image,
      tags,
      requirements,
      benefits,
      contactInfo
    } = req.body;
    
    const organizer = req.auth._id;

    // Validation
    if (!title || !description || !category || !eventType || !location || !startDate || !endDate || !startTime || !endTime || !maxAttendees) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided"
      });
    }

    // Check if user exists and is verified
    const user = await User.findById(organizer);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (!user.kycInfo || !user.kycInfo.isVerified) {
      return res.status(403).json({
        success: false,
        message: "You must be KYC verified to create events"
      });
    }

    // Only business users can create events
    if (user.role !== 'business') {
      return res.status(403).json({
        success: false,
        message: "Only business accounts can create events"
      });
    }

    // Validate dates
    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${endDate}T${endTime}`);
    
    if (startDateTime >= endDateTime) {
      return res.status(400).json({
        success: false,
        message: "End date/time must be after start date/time"
      });
    }

    if (startDateTime < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Event cannot be scheduled in the past"
      });
    }

    const eventData = {
      title,
      description,
      category,
      eventType,
      location,
      startDate: startDateTime,
      endDate: endDateTime,
      startTime,
      endTime,
      maxAttendees,
      registrationFee: registrationFee || 0,
      currency: currency || 'USD',
      image: image || null,
      organizer,
      tags: tags || [],
      requirements: requirements || [],
      benefits: benefits || [],
      contactInfo: contactInfo || {},
      isActive: true,
      isPublished: false,
      registeredUsers: [],
      likes: [],
      comments: []
    };

    const event = new Event(eventData);
    await event.save();

    // Populate the organizer field
    await event.populate('organizer', 'fname lname email role userProfileImage businessInfo');

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      data: event
    });

  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({
      success: false,
      message: "Error creating event",
      error: error.message
    });
  }
};

// Get all published events with pagination and filtering
export const getAllEvents = async (req, res) => {
  try {
    console.log("getAllEvents called with query:", req.query);
    console.log("Request URL:", req.url);
    console.log("Request method:", req.method);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const category = req.query.category;
    const eventType = req.query.eventType;
    const search = req.query.search;
    const featured = req.query.featured;
    const skip = (page - 1) * limit;

    // Build query - search by title, description, and tags
    let query = { 
      // No filters needed since isActive and isPublished don't exist in Event model
    };
    
    if (category) {
      query.category = category;
    }
    
    if (eventType) {
      query.eventType = eventType;
    }
    
    if (featured === 'true') {
      query.isFeatured = true;
    }
    
    // Search by title, description, and tags (not by ID)
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    console.log("Final query:", JSON.stringify(query, null, 2));

    // Debug: Check total events in database
    const totalEventsInDB = await Event.countDocuments({});
    console.log("Total events in database:", totalEventsInDB);
    
    // Debug: Check a few sample events
    const sampleEvents = await Event.find({}).limit(3).select('title isActive isPublished');
    console.log("Sample events:", sampleEvents);

    // Get total count
    const totalEvents = await Event.countDocuments(query);
    console.log("Total events found with query:", totalEvents);
    
    // Get events with pagination
    const events = await Event.find(query)
      .populate('organizer', 'fname lname email role userProfileImage businessInfo')
      .populate('likes', 'fname lname')
      .populate('comments.postedBy', 'fname lname userProfileImage')
      .sort({ startDate: 1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalEvents / limit);

    res.json({
      success: true,
      data: events,
      pagination: {
        currentPage: page,
        totalPages,
        totalEvents,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit
      }
    });

  } catch (error) {
    console.error("Error fetching events:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Error fetching events",
      error: error.message,
      details: error.stack
    });
  }
};

// Get events by organizer (for business dashboard)
export const getEventsByOrganizer = async (req, res) => {
  try {
    console.log("getEventsByOrganizer called with params:", req.params);
    console.log("getEventsByOrganizer called with query:", req.query);
    const { organizerId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalEvents = await Event.countDocuments({ organizer: organizerId, isActive: true });
    
    const events = await Event.find({ organizer: organizerId, isActive: true })
      .populate('organizer', 'fname lname email role userProfileImage businessInfo')
      .populate('registeredUsers.user', 'fname lname email userProfileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalEvents / limit);

    res.json({
      success: true,
      data: events,
      pagination: {
        currentPage: page,
        totalPages,
        totalEvents,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit
      }
    });

  } catch (error) {
    console.error("Error fetching organizer events:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching organizer events",
      error: error.message
    });
  }
};

// Get single event by ID
export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("getEventById called with id:", id);
    console.log("Request URL:", req.url);
    console.log("Request query:", req.query);

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log("Invalid ObjectId:", id);
      return res.status(400).json({
        success: false,
        message: "Invalid event ID format"
      });
    }

    const event = await Event.findById(id)
      .populate('organizer', 'fname lname email role userProfileImage businessInfo')
      .populate('likes', 'fname lname userProfileImage')
      .populate('comments.postedBy', 'fname lname userProfileImage')
      .populate('registeredUsers.user', 'fname lname email userProfileImage');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    res.json({
      success: true,
      data: event
    });

  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching event",
      error: error.message
    });
  }
};

// Update event
export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.auth._id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID format"
      });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    // Check if user owns the event
    if (event.organizer.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own events"
      });
    }

    // Validate dates if provided
    if (updateData.startDate && updateData.endDate) {
      const startDateTime = new Date(`${updateData.startDate}T${updateData.startTime || event.startTime}`);
      const endDateTime = new Date(`${updateData.endDate}T${updateData.endTime || event.endTime}`);
      
      if (startDateTime >= endDateTime) {
        return res.status(400).json({
          success: false,
          message: "End date/time must be after start date/time"
        });
      }
    }

    const updatedEvent = await Event.findByIdAndUpdate(id, updateData, { new: true })
      .populate('organizer', 'fname lname email role userProfileImage businessInfo');

    res.json({
      success: true,
      message: "Event updated successfully",
      data: updatedEvent
    });

  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({
      success: false,
      message: "Error updating event",
      error: error.message
    });
  }
};

// Delete event
export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.auth._id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID format"
      });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    // Check if user owns the event
    if (event.organizer.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own events"
      });
    }

    await Event.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Event deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting event",
      error: error.message
    });
  }
};

// Register for event
export const registerForEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { additionalInfo, contactInfo } = req.body;
    const userId = req.auth._id;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    if (!event.isPublished) {
      return res.status(400).json({
        success: false,
        message: "Event is not published yet"
      });
    }

    // Check if event is full
    if (event.registeredUsers.length >= event.maxAttendees) {
      return res.status(400).json({
        success: false,
        message: "Event is full"
      });
    }

    // Check if user already registered
    const existingRegistration = event.registeredUsers.find(
      reg => reg.user.toString() === userId
    );

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: "You have already registered for this event"
      });
    }

    const registration = {
      user: userId,
      additionalInfo: additionalInfo || '',
      contactInfo: contactInfo || {},
      status: 'registered',
      paymentStatus: event.registrationFee > 0 ? 'pending' : 'paid'
    };

    event.registeredUsers.push(registration);
    await event.save();

    res.json({
      success: true,
      message: "Registration successful",
      data: registration
    });

  } catch (error) {
    console.error("Error registering for event:", error);
    res.status(500).json({
      success: false,
      message: "Error registering for event",
      error: error.message
    });
  }
};

// Get registered users for an event
export const getEventRegistrations = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.auth._id;

    const event = await Event.findById(id)
      .populate('registeredUsers.user', 'fname lname email userProfileImage businessInfo');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    // Check if user owns the event
    if (event.organizer.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only view registrations for your own events"
      });
    }

    res.json({
      success: true,
      data: event.registeredUsers
    });

  } catch (error) {
    console.error("Error fetching event registrations:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching event registrations",
      error: error.message
    });
  }
};

// Like/Unlike event
export const toggleEventLike = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.auth._id;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    const isLiked = event.likes.includes(userId);

    if (isLiked) {
      event.likes.pull(userId);
    } else {
      event.likes.push(userId);
    }

    await event.save();

    res.json({
      success: true,
      message: isLiked ? "Event unliked" : "Event liked",
      data: {
        isLiked: !isLiked,
        likesCount: event.likes.length
      }
    });

  } catch (error) {
    console.error("Error toggling event like:", error);
    res.status(500).json({
      success: false,
      message: "Error toggling event like",
      error: error.message
    });
  }
};

// Add comment to event
export const addEventComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.auth._id;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: "Comment text is required"
      });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    const comment = {
      text,
      postedBy: userId
    };

    event.comments.push(comment);
    await event.save();

    // Populate the comment
    await event.populate('comments.postedBy', 'fname lname userProfileImage');

    const newComment = event.comments[event.comments.length - 1];

    res.json({
      success: true,
      message: "Comment added successfully",
      data: newComment
    });

  } catch (error) {
    console.error("Error adding event comment:", error);
    res.status(500).json({
      success: false,
      message: "Error adding event comment",
      error: error.message
    });
  }
};

// Get all events (for admin)
export const getAllEventsAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const category = req.query.category;
    const eventType = req.query.eventType;
    const search = req.query.search;
    const skip = (page - 1) * limit;

    // Build query
    let query = { isActive: true };
    
    if (category) {
      query.category = category;
    }
    
    if (eventType) {
      query.eventType = eventType;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Get total count
    const totalEvents = await Event.countDocuments(query);
    
    // Get events with pagination
    const events = await Event.find(query)
      .populate('organizer', 'fname lname email role userProfileImage businessInfo')
      .populate('registeredUsers.user', 'fname lname email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalEvents / limit);

    res.json({
      success: true,
      data: events,
      pagination: {
        currentPage: page,
        totalPages,
        totalEvents,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit
      }
    });

  } catch (error) {
    console.error("Error fetching events for admin:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching events for admin",
      error: error.message
    });
  }
};

// Publish event (owner only)
export const publishEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.auth._id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID format"
      });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    // Check if user owns the event
    if (event.organizer.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only publish your own events"
      });
    }

    // Publish the event
    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      { isPublished: true },
      { new: true }
    ).populate('organizer', 'fname lname email role userProfileImage businessInfo');

    res.json({
      success: true,
      message: "Event published successfully",
      data: updatedEvent
    });

  } catch (error) {
    console.error("Error publishing event:", error);
    res.status(500).json({
      success: false,
      message: "Error publishing event",
      error: error.message
    });
  }
};

// Unpublish event (owner only)
export const unpublishEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.auth._id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID format"
      });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    // Check if user owns the event
    if (event.organizer.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only unpublish your own events"
      });
    }

    // Unpublish the event
    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      { isPublished: false },
      { new: true }
    ).populate('organizer', 'fname lname email role userProfileImage businessInfo');

    res.json({
      success: true,
      message: "Event unpublished successfully",
      data: updatedEvent
    });

  } catch (error) {
    console.error("Error unpublishing event:", error);
    res.status(500).json({
      success: false,
      message: "Error unpublishing event",
      error: error.message
    });
  }
};

// Toggle featured status of an event (Admin only)
export const toggleEventFeatured = async (req, res) => {
  try {
    const { id } = req.params;
    const { isFeatured } = req.body;

    console.log("toggleEventFeatured called with:", { id, isFeatured });

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID format"
      });
    }

    // Find the event
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    // Update featured status
    const updateData = {
      isFeatured: isFeatured === true || isFeatured === 'true'
    };

    // If featuring the event, set featuredAt timestamp
    if (updateData.isFeatured) {
      updateData.featuredAt = new Date();
    } else {
      updateData.featuredAt = null;
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('organizer', 'fname lname email role userProfileImage businessInfo');

    res.json({
      success: true,
      message: `Event ${updateData.isFeatured ? 'featured' : 'unfeatured'} successfully`,
      data: {
        event: updatedEvent,
        isFeatured: updatedEvent.isFeatured,
        featuredAt: updatedEvent.featuredAt
      }
    });

  } catch (error) {
    console.error("Error toggling event featured status:", error);
    res.status(500).json({
      success: false,
      message: "Error toggling event featured status",
      error: error.message
    });
  }
};
