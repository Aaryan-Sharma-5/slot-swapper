import { Response } from 'express';
import pool from '../db/connection.js';
import { AuthRequest } from '../middleware/auth.js';
import { createEventSchema, updateEventStatusSchema } from '../utils/validation.js';

export const getMyEvents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    const result = await pool.query(
      'SELECT id, title, start_time, end_time, status, created_at FROM events WHERE user_id = $1 ORDER BY start_time ASC',
      [userId]
    );

    res.json({
      events: result.rows.map((row) => ({
        id: row.id,
        title: row.title,
        startTime: row.start_time,
        endTime: row.end_time,
        status: row.status,
        createdAt: row.created_at,
      })),
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const validatedData = createEventSchema.parse(req.body);
    const { title, startTime, endTime } = validatedData;

    const result = await pool.query(
      'INSERT INTO events (title, start_time, end_time, user_id) VALUES ($1, $2, $3, $4) RETURNING id, title, start_time, end_time, status, created_at',
      [title, startTime, endTime, userId]
    );

    const event = result.rows[0];

    res.status(201).json({
      event: {
        id: event.id,
        title: event.title,
        startTime: event.start_time,
        endTime: event.end_time,
        status: event.status,
        createdAt: event.created_at,
      },
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      console.error('Create event error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const updateEventStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const eventId = parseInt(req.params.id);
    const validatedData = updateEventStatusSchema.parse(req.body);
    const { status } = validatedData;

    // Check if event exists and belongs to user
    const checkResult = await pool.query(
      'SELECT id, status FROM events WHERE id = $1 AND user_id = $2',
      [eventId, userId]
    );

    if (checkResult.rows.length === 0) {
      res.status(404).json({ error: 'Event not found or you do not have permission' });
      return;
    }

    const currentStatus = checkResult.rows[0].status;

    // Prevent changing status if event is in SWAP_PENDING
    if (currentStatus === 'SWAP_PENDING') {
      res.status(400).json({ error: 'Cannot change status of an event with pending swap' });
      return;
    }

    const result = await pool.query(
      'UPDATE events SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, title, start_time, end_time, status',
      [status, eventId]
    );

    const event = result.rows[0];

    res.json({
      event: {
        id: event.id,
        title: event.title,
        startTime: event.start_time,
        endTime: event.end_time,
        status: event.status,
      },
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      console.error('Update event status error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const deleteEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const eventId = parseInt(req.params.id);

    // Check if event has pending swaps
    const swapCheck = await pool.query(
      'SELECT id FROM swap_requests WHERE (requester_event_id = $1 OR receiver_event_id = $1) AND status = $2',
      [eventId, 'PENDING']
    );

    if (swapCheck.rows.length > 0) {
      res.status(400).json({ error: 'Cannot delete event with pending swap requests' });
      return;
    }

    const result = await pool.query(
      'DELETE FROM events WHERE id = $1 AND user_id = $2 RETURNING id',
      [eventId, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Event not found or you do not have permission' });
      return;
    }

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
