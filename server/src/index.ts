import express, { Application } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
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
import path from 'path';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL || true,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Transform all JSON responses to camelCase
app.use(camelCaseResponse());

// Rate limiting (disabled in development mode)
const isDevelopment = process.env.NODE_ENV !== 'production';

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 1000 : 100, // Higher limit in development
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDevelopment, // Skip rate limiting in development
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 500 : 50, // Higher limit in development
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

// Apply global rate limiter to all requests
app.use(globalLimiter);

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

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
