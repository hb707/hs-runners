import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import { env } from './config/env';
import routes from './routes';
import { errorMiddleware } from './middleware/error.middleware';

const app = express();

app.use(helmet());
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images (auth not required for image serving - URLs are not guessable)
app.use('/uploads', express.static(path.resolve(env.UPLOADS_DIR)));

app.use('/api', routes);

app.use(errorMiddleware);

export default app;
