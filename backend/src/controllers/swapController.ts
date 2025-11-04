import { Response } from 'express';
import pool from '../db/connection.js';
import { AuthRequest } from '../middleware/auth.js';
import { swapRequestSchema, swapResponseSchema } from '../utils/validation.js';

export const getSwappableSlots = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    const result = await pool.query(
      `SELECT e.id, e.title, e.start_time, e.end_time, u.id as user_id, u.name as user_name
       FROM events e
       JOIN users u ON e.user_id = u.id
       WHERE e.status = $1 AND e.user_id != $2
       ORDER BY e.start_time ASC`,
      ['SWAPPABLE', userId]
    );

    res.json({
      slots: result.rows.map((row) => ({
        id: row.id,
        title: row.title,
        startTime: row.start_time,
        endTime: row.end_time,
        userId: row.user_id,
        userName: row.user_name,
      })),
    });
  } catch (error) {
    console.error('Get swappable slots error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createSwapRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  const client = await pool.connect();

  try {
    const userId = req.userId!;
    const validatedData = swapRequestSchema.parse(req.body);
    const { mySlotId, theirSlotId } = validatedData;

    await client.query('BEGIN');

    // Verify my slot exists and belongs to me
    const mySlotResult = await client.query(
      'SELECT id, status, user_id FROM events WHERE id = $1 FOR UPDATE',
      [mySlotId]
    );

    if (mySlotResult.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Your slot not found' });
      return;
    }

    const mySlot = mySlotResult.rows[0];

    if (mySlot.user_id !== userId) {
      await client.query('ROLLBACK');
      res.status(403).json({ error: 'You do not own this slot' });
      return;
    }

    if (mySlot.status !== 'SWAPPABLE') {
      await client.query('ROLLBACK');
      res.status(400).json({ error: 'Your slot must be SWAPPABLE' });
      return;
    }

    // Verify their slot exists and is swappable
    const theirSlotResult = await client.query(
      'SELECT id, status, user_id FROM events WHERE id = $1 FOR UPDATE',
      [theirSlotId]
    );

    if (theirSlotResult.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Their slot not found' });
      return;
    }

    const theirSlot = theirSlotResult.rows[0];

    if (theirSlot.user_id === userId) {
      await client.query('ROLLBACK');
      res.status(400).json({ error: 'Cannot swap with your own slot' });
      return;
    }

    if (theirSlot.status !== 'SWAPPABLE') {
      await client.query('ROLLBACK');
      res.status(400).json({ error: 'Their slot must be SWAPPABLE' });
      return;
    }

    // Check if there's already a pending request between these slots
    const existingRequest = await client.query(
      `SELECT id FROM swap_requests 
       WHERE status = $1 
       AND ((requester_event_id = $2 AND receiver_event_id = $3) 
       OR (requester_event_id = $3 AND receiver_event_id = $2))`,
      ['PENDING', mySlotId, theirSlotId]
    );

    if (existingRequest.rows.length > 0) {
      await client.query('ROLLBACK');
      res.status(400).json({ error: 'A swap request already exists for these slots' });
      return;
    }

    // Create swap request
    const swapResult = await client.query(
      `INSERT INTO swap_requests (requester_id, requester_event_id, receiver_id, receiver_event_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, created_at`,
      [userId, mySlotId, theirSlot.user_id, theirSlotId]
    );

    // Update both slots to SWAP_PENDING
    await client.query(
      'UPDATE events SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = ANY($2)',
      ['SWAP_PENDING', [mySlotId, theirSlotId]]
    );

    await client.query('COMMIT');

    res.status(201).json({
      swapRequest: {
        id: swapResult.rows[0].id,
        mySlotId,
        theirSlotId,
        status: 'PENDING',
        createdAt: swapResult.rows[0].created_at,
      },
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      console.error('Create swap request error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } finally {
    client.release();
  }
};

export const respondToSwapRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  const client = await pool.connect();

  try {
    const userId = req.userId!;
    const requestId = parseInt(req.params.requestId);
    
    console.log('Responding to swap request:', {
      requestId,
      userId,
      body: req.body,
      params: req.params
    });
    
    const validatedData = swapResponseSchema.parse(req.body);
    const { accept } = validatedData;

    await client.query('BEGIN');

    // Get the swap request
    const swapResult = await client.query(
      `SELECT sr.id, sr.requester_id, sr.requester_event_id, sr.receiver_id, sr.receiver_event_id, sr.status
       FROM swap_requests sr
       WHERE sr.id = $1 FOR UPDATE`,
      [requestId]
    );

    if (swapResult.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Swap request not found' });
      return;
    }

    const swapRequest = swapResult.rows[0];

    // Verify the user is the receiver
    if (swapRequest.receiver_id !== userId) {
      await client.query('ROLLBACK');
      res.status(403).json({ error: 'You are not authorized to respond to this request' });
      return;
    }

    // Check if already responded
    if (swapRequest.status !== 'PENDING') {
      await client.query('ROLLBACK');
      res.status(400).json({ error: 'This swap request has already been responded to' });
      return;
    }

    if (!accept) {
      // REJECT: Set swap request to REJECTED and both events back to SWAPPABLE
      await client.query(
        'UPDATE swap_requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['REJECTED', requestId]
      );

      await client.query(
        'UPDATE events SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = ANY($2)',
        ['SWAPPABLE', [swapRequest.requester_event_id, swapRequest.receiver_event_id]]
      );

      await client.query('COMMIT');

      res.json({
        message: 'Swap request rejected',
        swapRequest: {
          id: requestId,
          status: 'REJECTED',
        },
      });
    } else {
      // ACCEPT: The key transaction - swap the owners
      await client.query(
        'UPDATE swap_requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['ACCEPTED', requestId]
      );

      // Swap the user_id of both events and set status to BUSY
      await client.query(
        `UPDATE events SET 
          user_id = CASE 
            WHEN id = $1 THEN $2::integer 
            WHEN id = $3 THEN $4::integer 
          END,
          status = $5::event_status,
          updated_at = CURRENT_TIMESTAMP
         WHERE id = ANY($6)`,
        [
          swapRequest.requester_event_id,
          swapRequest.receiver_id,
          swapRequest.receiver_event_id,
          swapRequest.requester_id,
          'BUSY',
          [swapRequest.requester_event_id, swapRequest.receiver_event_id],
        ]
      );

      await client.query('COMMIT');

      res.json({
        message: 'Swap request accepted',
        swapRequest: {
          id: requestId,
          status: 'ACCEPTED',
        },
      });
    }
  } catch (error: any) {
    await client.query('ROLLBACK');
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      console.error('Respond to swap request error:', error);
      console.error('Error stack:', error.stack);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        detail: error.detail
      });
      res.status(500).json({ error: 'Internal server error', message: error.message });
    }
  } finally {
    client.release();
  }
};

export const getMySwapRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    // Get incoming requests (where I'm the receiver)
    const incomingResult = await pool.query(
      `SELECT 
        sr.id, sr.status, sr.created_at,
        e1.id as their_slot_id, e1.title as their_slot_title, e1.start_time as their_slot_start, e1.end_time as their_slot_end,
        e2.id as my_slot_id, e2.title as my_slot_title, e2.start_time as my_slot_start, e2.end_time as my_slot_end,
        u.id as requester_id, u.name as requester_name
       FROM swap_requests sr
       JOIN events e1 ON sr.requester_event_id = e1.id
       JOIN events e2 ON sr.receiver_event_id = e2.id
       JOIN users u ON sr.requester_id = u.id
       WHERE sr.receiver_id = $1
       ORDER BY sr.created_at DESC`,
      [userId]
    );

    // Get outgoing requests (where I'm the requester)
    const outgoingResult = await pool.query(
      `SELECT 
        sr.id, sr.status, sr.created_at,
        e1.id as my_slot_id, e1.title as my_slot_title, e1.start_time as my_slot_start, e1.end_time as my_slot_end,
        e2.id as their_slot_id, e2.title as their_slot_title, e2.start_time as their_slot_start, e2.end_time as their_slot_end,
        u.id as receiver_id, u.name as receiver_name
       FROM swap_requests sr
       JOIN events e1 ON sr.requester_event_id = e1.id
       JOIN events e2 ON sr.receiver_event_id = e2.id
       JOIN users u ON sr.receiver_id = u.id
       WHERE sr.requester_id = $1
       ORDER BY sr.created_at DESC`,
      [userId]
    );

    res.json({
      incoming: incomingResult.rows.map((row) => ({
        id: row.id,
        status: row.status,
        createdAt: row.created_at,
        theirSlot: {
          id: row.their_slot_id,
          title: row.their_slot_title,
          startTime: row.their_slot_start,
          endTime: row.their_slot_end,
        },
        mySlot: {
          id: row.my_slot_id,
          title: row.my_slot_title,
          startTime: row.my_slot_start,
          endTime: row.my_slot_end,
        },
        requester: {
          id: row.requester_id,
          name: row.requester_name,
        },
      })),
      outgoing: outgoingResult.rows.map((row) => ({
        id: row.id,
        status: row.status,
        createdAt: row.created_at,
        mySlot: {
          id: row.my_slot_id,
          title: row.my_slot_title,
          startTime: row.my_slot_start,
          endTime: row.my_slot_end,
        },
        theirSlot: {
          id: row.their_slot_id,
          title: row.their_slot_title,
          startTime: row.their_slot_start,
          endTime: row.their_slot_end,
        },
        receiver: {
          id: row.receiver_id,
          name: row.receiver_name,
        },
      })),
    });
  } catch (error) {
    console.error('Get swap requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
