import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { appConfig, generateSwaggerSpec } from './config';
import routes from './routes';
import { errorHandler, notFoundHandler, generalLimiter } from './middleware';
import { logger } from './shared/utils/logger.util';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: appConfig.corsOrigin,
  credentials: true,
}));

// Rate limiting
app.use(generalLimiter);

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

// API routes
app.use(appConfig.apiPrefix, routes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
