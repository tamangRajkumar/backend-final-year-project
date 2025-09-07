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
  getAllEventsAdmin
} from "../controllers/eventController.js";

const router = express.Router();

// Create a new event (Business only)
router.post("/", requireSignin, createEvent);

// Get all published events (public)
router.get("/", getAllEvents);

// Get all events for admin
router.get("/admin/all", requireSignin, requireAdmin, getAllEventsAdmin);

// Get events by organizer (for business dashboard)
router.get("/organizer/:organizerId", requireSignin, getEventsByOrganizer);

// Get single event by ID
router.get("/:id", getEventById);

// Update event (owner only)
router.put("/:id", requireSignin, updateEvent);

// Delete event (owner only)
router.delete("/:id", requireSignin, deleteEvent);

// Register for event
router.post("/:id/register", requireSignin, registerForEvent);

// Get registered users for an event (owner only)
router.get("/:id/registrations", requireSignin, getEventRegistrations);

// Like/Unlike event
router.post("/:id/like", requireSignin, toggleEventLike);

// Add comment to event
router.post("/:id/comment", requireSignin, addEventComment);

export default router;
