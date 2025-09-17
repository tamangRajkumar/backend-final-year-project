import express from "express";
import { requireSignin } from "../middlewares/auth.js";
import { requireAdmin } from "../middlewares/roleAuth.js";
import {
  createEvent,
  getAllEvents,
  getEventsByOrganizer,
  getEventById,
  updateEvent,
  deleteEvent,
  registerForEvent,
  getEventRegistrations,
  toggleEventLike,
  addEventComment,
  getAllEventsAdmin,
  toggleEventFeatured
} from "../controllers/eventController.js";

const router = express.Router();

// Create a new event (Business only)
router.post("/", requireSignin, createEvent);

// Test route
router.get("/test", (req, res) => {
  res.json({ message: "Event routes are working!" });
});

// Test all routes
router.get("/test-all", (req, res) => {
  res.json({ 
    message: "Event routes are working!",
    availableRoutes: [
      "GET /api/event/test",
      "GET /api/event/test-db", 
      "GET /api/event/test-minimal",
      "GET /api/event/test-search",
      "GET /api/event/",
      "GET /api/event/search",
      "GET /api/event/:id"
    ]
  });
});

// Test route with database check
router.get("/test-db", async (req, res) => {
  try {
    const Event = (await import("../models/event.js")).default;
    const count = await Event.countDocuments();
    res.json({ 
      message: "Event routes are working!", 
      totalEvents: count,
      databaseConnected: true 
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Database error", 
      error: error.message 
    });
  }
});

// Minimal test route - just find one event
router.get("/test-minimal", async (req, res) => {
  try {
    const Event = (await import("../models/event.js")).default;
    console.log("Testing minimal event query...");
    
    // Try to find just one event with minimal query
    const event = await Event.findOne({});
    console.log("Found event:", event ? "Yes" : "No");
    
    res.json({ 
      message: "Minimal test successful", 
      foundEvent: !!event,
      eventId: event?._id
    });
  } catch (error) {
    console.error("Minimal test error:", error);
    res.status(500).json({ 
      message: "Minimal test failed", 
      error: error.message,
      stack: error.stack
    });
  }
});

// Test event search by title
router.get("/test-search", async (req, res) => {
  try {
    const Event = (await import("../models/event.js")).default;
    const { q } = req.query;
    console.log("Testing event search for:", q);
    
    if (!q) {
      return res.json({ message: "Please provide a search query with ?q=searchterm" });
    }
    
    // Search by title only
    const events = await Event.find({
      title: { $regex: q, $options: 'i' }
    });
    
    console.log("Found events by title:", events.length);
    
    res.json({ 
      message: "Title search successful", 
      searchQuery: q,
      foundEvents: events.length,
      events: events.map(e => ({ id: e._id, title: e.title }))
    });
  } catch (error) {
    console.error("Title search error:", error);
    res.status(500).json({ 
      message: "Title search failed", 
      error: error.message,
      stack: error.stack
    });
  }
});

// Get all published events (public) - explicit root route
router.get("/", (req, res) => {
  console.log("Root route / called with query:", req.query);
  return getAllEvents(req, res);
});

// Search events (explicit search route)
router.get("/search", getAllEvents);

// Get all events for admin
router.get("/admin/all", requireSignin, requireAdmin, getAllEventsAdmin);

// Get events by organizer (for business dashboard) - MUST come before /:id route
router.get("/event/organizer/:organizerId", requireSignin, (req, res, next) => {
  console.log("Organizer route called with params:", req.params);
  console.log("Organizer route called with query:", req.query);
  next();
}, getEventsByOrganizer);

// Get single event by ID (only for valid ObjectIds) - MUST come after specific routes
router.get("/:id", (req, res, next) => {
  const { id } = req.params;
  console.log("Route /:id called with id:", id);
  console.log("Request URL:", req.url);
  console.log("Request query:", req.query);
  
  // Check if it's a valid ObjectId format (24 hex characters)
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    console.log("Not a valid ObjectId, redirecting to getAllEvents");
    // If not a valid ObjectId, treat it as a query parameter and pass to getAllEvents
    return getAllEvents(req, res);
  }
  
  console.log("Valid ObjectId, proceeding to getEventById");
  // If it's a valid ObjectId, proceed to getEventById
  next();
}, getEventById);

// Toggle featured status (Admin only) - MUST come before /:id route
router.put("/:id/featured", requireSignin, requireAdmin, toggleEventFeatured);

// Register for event
router.post("/:id/register", requireSignin, registerForEvent);

// Get registered users for an event (owner only)
router.get("/:id/registrations", requireSignin, getEventRegistrations);

// Like/Unlike event
router.post("/:id/like", requireSignin, toggleEventLike);

// Add comment to event
router.post("/:id/comment", requireSignin, addEventComment);

// Update event (owner only)
router.put("/:id", requireSignin, updateEvent);

// Delete event (owner only)
router.delete("/:id", requireSignin, deleteEvent);

export default router;
