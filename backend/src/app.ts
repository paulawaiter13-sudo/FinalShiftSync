import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';
import {
  errorHandler,
  notFoundHandler,
} from './middleware/errorHandler';

dotenv.config();

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'https://final-shift-sync.vercel.app',
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow Postman, Render health checks, and server-to-server requests.
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.error(`Blocked by CORS: ${origin}`);
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// The cors middleware above handles preflight requests.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (_req, res) => {
  res.status(200).json({
    message: 'ShiftSync API is running',
    status: 'ok',
  });
});

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
