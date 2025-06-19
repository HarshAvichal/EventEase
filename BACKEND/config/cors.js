import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

// Debug logging for CORS troubleshooting
export function corsDebugLogger(req, res, next) {
    // All console.log lines removed
    next();
}

// const allowedOrigins = [
//     process.env.FRONTEND_URL || 'http://localhost:5173', // Default Vite dev server
//     'http://localhost:3000',
//     // Add your production frontend URL here
// ];

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, postman)
        // Also allow any localhost port for development
        if (!origin || origin.startsWith('http://localhost:')) return callback(null, true);
        
        // If you have specific production origins, you would check them here.
        // For example: 
        // if (process.env.NODE_ENV === 'production' && allowedProductionOrigins.includes(origin)) {
        //     return callback(null, true);
        // }

        const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
        return callback(new Error(msg), false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: false,
    maxAge: 86400,
};

export const corsMiddleware = cors(corsOptions); 