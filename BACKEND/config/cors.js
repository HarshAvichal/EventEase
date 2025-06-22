import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

// Debug logging for CORS troubleshooting
export function corsDebugLogger(req, res, next) {
    // All console.log lines removed
    next();
}

const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:3000',
    'https://event-ease-in.vercel.app/',
];

const corsOptions = {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    maxAge: 86400,
};

export const corsMiddleware = cors(corsOptions); 