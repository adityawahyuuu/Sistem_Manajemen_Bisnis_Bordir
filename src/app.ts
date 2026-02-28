import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { appConfig, generateSwaggerSpec, storageConfig } from './config';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware';
import { logger } from './shared/utils/logger.util';

const app = express();

// Trust proxy - required when behind nginx/ngrok
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS - support comma-separated origins from env, including ngrok dynamic URLs
const allowedOrigins = (appConfig.corsOrigin as string).split(',').map(o => o.trim());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (Postman, curl, server-to-server)
    if (!origin) return callback(null, true);
    // Allow if origin matches allowed list or is an ngrok URL
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.ngrok-free.app') ||
      origin.endsWith('.ngrok.io') ||
      /^https?:\/\/localhost(:\d+)?$/.test(origin)
    ) {
      return callback(null, true);
    }
    callback(new Error(`CORS not allowed for origin: ${origin}`));
  },
  credentials: true,
}));

// Cookie parser
app.use(cookieParser());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) },
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Swagger documentation - setup with async generated spec
let swaggerSpec: any = null;

app.use('/api-docs', swaggerUi.serve, async (req: Request, res: Response, next: NextFunction) => {
  if (!swaggerSpec) {
    swaggerSpec = await generateSwaggerSpec();
  }
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customSiteTitle: 'Bordir API Documentation',
  })(req, res, next);
});

// Swagger JSON endpoint
app.get('/api-docs.json', async (req, res) => {
  if (!swaggerSpec) {
    swaggerSpec = await generateSwaggerSpec();
  }
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Static file serving for uploads
app.use(
  '/uploads',
  express.static(path.resolve(storageConfig.uploadsPath), {
    setHeaders(res) {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    }
  })
);

// API routes
app.use(appConfig.apiPrefix, routes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
