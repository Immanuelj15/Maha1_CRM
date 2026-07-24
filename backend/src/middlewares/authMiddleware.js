import jwt from 'jsonwebtoken';
import { User } from '../models/schemas.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'catermaster_secret_key');
      
      // Guard against old local-mode tokens that have non-ObjectId string IDs
      let userId = decoded.id;
      const isValidObjectId = /^[a-f\d]{24}$/i.test(String(userId));
      if (!isValidObjectId) {
        return res.status(401).json({ success: false, message: 'Session expired — please log in again.' });
      }

      req.user = await User.findById(userId);
      
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'User associated with this token no longer exists.' });
      }
      
      next();
    } catch (error) {
      // Don't log ObjectId cast errors as they are expected when old tokens are used
      if (!error.message.includes('Cast to ObjectId')) {
        console.error('JWT validation error:', error.message);
      }
      return res.status(401).json({ success: false, message: 'Not authorized, token validation failed.' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided.' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user?.role || 'none'}' is not authorized to access this route.`
      });
    }
    next();
  };
};
