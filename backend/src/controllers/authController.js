import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

function signToken(user) {
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  const payload = {
    id: user._id,
    role: user.role,
    divisionAccess: user.divisionAccess,
  };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = signToken(user);
    res.json({ user: user.toJSON(), token });
  } catch (err) {
    next(err);
  }
}

export async function bootstrapOwner(req, res, next) {
  try {
    const existingOwnerOrAdmin = await User.findOne({ role: { $in: ['Owner', 'Admin'] } });
    if (existingOwnerOrAdmin) {
      return res.status(400).json({ message: 'Owner/Admin already exists' });
    }

    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email, and password are required' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: 'Owner',
      divisionAccess: ['Renovations', 'Radiance'],
    });

    const token = signToken(user);
    res.status(201).json({ user: user.toJSON(), token });
  } catch (err) {
    next(err);
  }
}