import express from 'express';
import cookieParser from 'cookie-parser';
import eventsRouter from './routes/events.router.js';
import sessionsRouter from './routes/sessions.router.js';

const app = express();

app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Servidor activo' });
});

app.use('/api/events', eventsRouter);
app.use('/api/sessions', sessionsRouter);

app.use((req, res) => {
  res.status(404).json({ status: 'error', message: 'Recurso no encontrado' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
});

export default app;
