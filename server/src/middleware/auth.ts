import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const JWT_SECRET =
  process.env.JWT_SECRET ?? 'wellbeing-dev-secret-CHANGE-IN-PRODUCTION';

export interface JWTPayload {
  id: number;
  email: string;
  name: string;
  role: string;
  teamId: number | null;
}

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

export function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  try {
    const token = authHeader.split(' ')[1];
    req.user = jwt.verify(token, JWT_SECRET) as JWTPayload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireManager(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  if (req.user?.role !== 'manager') {
    res.status(403).json({ error: 'Manager access required' });
    return;
  }
  next();
}
