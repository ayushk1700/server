import { Request, Response } from 'express';
import pool from '../config/db';
import jwt from 'jsonwebtoken';

export const register = async (req: Request, res: Response): Promise<void> => {
  const { phone, name, identityKey, publicKey, registrationId } = req.body;

  if (!phone || !name || !identityKey || !publicKey || !registrationId) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  try {
    const result = await pool.query(
      'INSERT INTO users (phone, name, identity_key, public_key, registration_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [phone, name, identityKey, publicKey, registrationId]
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, { expiresIn: '7d' });

    res.json({ user, token });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { phone } = req.body;

  if (!phone) {
    res.status(400).json({ error: 'Phone number is required' });
    return;
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, { expiresIn: '7d' });

    res.json({ user, token });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const uploadPreKeys = async (req: Request, res: Response): Promise<void> => {
  const { userId, preKeys } = req.body;

  if (!userId || !Array.isArray(preKeys) || preKeys.length === 0) {
    res.status(400).json({ error: 'userId and a non-empty preKeys array are required' });
    return;
  }

  try {
    const queries = preKeys.map((k: any) =>
      pool.query(
        'INSERT INTO pre_keys (user_id, key_id, public_key, is_signed, signature) VALUES ($1, $2, $3, $4, $5)',
        [userId, k.id, k.key, k.isSigned, k.signature]
      )
    );
    await Promise.all(queries);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getPreKeys = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  try {
    const userResult = await pool.query(
      'SELECT identity_key, registration_id FROM users WHERE id = $1',
      [userId]
    );
    if (userResult.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Fetch a single one-time pre-key
    const preKeysResult = await pool.query(
      'SELECT id, key_id, public_key, is_signed, signature FROM pre_keys WHERE user_id = $1 AND is_signed = FALSE LIMIT 1',
      [userId]
    );

    // FIX: Delete the pre-key after fetching — prevents replay attacks / broken forward secrecy
    if (preKeysResult.rows.length > 0) {
      await pool.query('DELETE FROM pre_keys WHERE id = $1', [preKeysResult.rows[0].id]);
    }

    const signedPreKeyResult = await pool.query(
      'SELECT id, key_id, public_key, signature FROM pre_keys WHERE user_id = $1 AND is_signed = TRUE ORDER BY created_at DESC LIMIT 1',
      [userId]
    );

    res.json({
      identityKey: userResult.rows[0].identity_key,
      registrationId: userResult.rows[0].registration_id,
      preKey: preKeysResult.rows[0] ?? null,
      signedPreKey: signedPreKeyResult.rows[0] ?? null,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
