import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDatabase } from '../db/index.js';
import { config } from '../config/index.js';

export const authRouter = Router();

authRouter.post('/login', (req: Request, res: Response): void => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  const db = getDatabase();
  const user = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username) as any;

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ error: 'Credenciales inválidas' });
    return;
  }

  const token = jwt.sign(
    { id: user.id, username: user.username },
    config.jwtSecret,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
    }
  });
});

export function authMiddleware(req: Request, res: Response, next: Function): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Acceso no autorizado. Token requerido.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    (req as any).user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}
