import express from 'express';
import cors, { CorsOptions } from 'cors';
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
  process.env.FRONTEND_URL,
  process.env.FRONTEND_PREVIEW_URL,
].filter((origin): origin is string => Boolean(origin));

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests without an Origin header, such as Postman,
    // Render health checks, or server-to-server requests.
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    console.warn(`CORS blocked request from origin: ${origin}`);

    callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// Handle browser preflight requests.
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Optional root endpoint.
app.get('/', (_req, res) => {
  res.status(200).json({
    message: 'ShiftSync API is running',
    status: 'ok',
  });
});

app.use('/api', routes);

// These handlers must remain after all valid routes.
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
