import type { Request, Response } from 'express';
import pool from '../config/db';
import { getIo } from '../config/socket';

export const sendMessage = async (req: Request, res: Response): Promise<void> => {
  const { senderId, recipientId, content, timestamp, type } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO messages (sender_id, recipient_id, content, timestamp, type) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [senderId, recipientId, content, timestamp, type]
    );

    const message = result.rows[0];

    // Notify recipient via socket (uses singleton — no circular import)
    getIo().to(recipientId).emit('new_message', message);

    res.json(message);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getMessages = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM messages WHERE sender_id = $1 OR recipient_id = $1 ORDER BY timestamp ASC',
      [userId]
    );
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
