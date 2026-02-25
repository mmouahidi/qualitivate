// IMPORTANT: Import env first to validate environment variables before anything else
import { env } from './config/env';
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import authRoutes from './routes/auth.routes';
import companyRoutes from './routes/company.routes';
import siteRoutes from './routes/site.routes';
import departmentRoutes from './routes/department.routes';
import userRoutes from './routes/user.routes';
import surveyRoutes from './routes/survey.routes';
import questionRoutes from './routes/question.routes';
import responseRoutes from './routes/response.routes';
import analyticsRoutes from './routes/analytics.routes';
import distributionRoutes from './routes/distribution.routes';
import templateRoutes from './routes/template.routes';
import { camelCaseResponse } from './utils/transformCase';
import db from './config/database';
import logger from './config/logger';
import correlationId from './middlewares/correlationId.middleware';
import { initSentry, captureException, addRequestContext } from './config/sentry';
import path from 'path';

// Initialize Sentry before app setup
initSentry();

const app: Application = express();
const PORT = env.PORT;
const isDevelopment = env.NODE_ENV !== 'production';

// Trust proxy in production (or explicit override)
app.set('trust proxy', env.TRUST_PROXY ?? (isDevelopment ? false : 1));

// Request correlation ID - must be first for traceability
app.use(correlationId);

// Security headers with Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", env.FRONTEND_URL],
    },
  },
  crossOriginEmbedderPolicy: false, // Required for serving React app
}));

// Request logging
app.use(morgan(isDevelopment ? 'dev' : 'combined', {
  skip: (req) => req.path === '/api/health', // Skip logging health checks
}));

// CORS — support multiple origins via CORS_ORIGINS env var
const allowedOrigins = env.CORS_ORIGINS
  ? env.CORS_ORIGINS.split(',').map(o => o.trim())
  : [env.FRONTEND_URL];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. curl, mobile apps, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true
}));

// Request size limits (prevent DoS via large payloads)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Transform all JSON responses to camelCase
app.use(camelCaseResponse());

// Rate limiting (disabled in development mode)

const globalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS, // 15 minutes default
  max: isDevelopment ? 1000 : env.RATE_LIMIT_MAX,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDevelopment, // Skip rate limiting in development
});

const authLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS, // 15 minutes default
  max: isDevelopment ? 500 : env.AUTH_RATE_LIMIT_MAX,
  message: { error: 'Too many authentication attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDevelopment, // Skip rate limiting in development
});

const surveyStartLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 survey starts per hour per IP
  message: { error: 'Too many survey starts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply global rate limiter to API routes only (avoid limiting static assets)
app.use('/api', globalLimiter);

// Apply stricter limits to auth routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/sites', siteRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/responses', responseRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/distributions', distributionRoutes);
app.use('/api/templates', templateRoutes);

// Health check with database connectivity (must be before catch-all)
app.get('/api/health', async (req, res) => {
  try {
    await db.raw('SELECT 1');
    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
    });
  }
});

// Calculate client build path correctly whether running from src or dist
const clientBuildPath = path.join(__dirname, '../../client/dist');

// Serve static files from the client build directory
app.use(express.static(clientBuildPath));

// Handle React routing, return all requests to React app
app.get('*', (req, res, next) => {
  // If the request is for an API endpoint that wasn't handled above, rely on 404 or next()
  if (req.path.startsWith('/api')) {
    return next();
  }

  res.sendFile(path.join(clientBuildPath, 'index.html'), (err) => {
    if (err) {
      if (!res.headersSent) {
        res.status(500).send('Client build not found. Please run "npm run build" in the client directory.');
      }
    }
  });
});



app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Add request context and capture error in Sentry
  addRequestContext(req);
  captureException(err, {
    path: req.path,
    method: req.method,
    correlationId: req.correlationId,
  });

  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    correlationId: req.correlationId
  });

  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    correlationId: req.correlationId,
    ...(isDevelopment && { stack: err.stack })
  });
});

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${env.NODE_ENV}`);
});

export default app;
