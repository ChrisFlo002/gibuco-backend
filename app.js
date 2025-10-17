import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import errorMiddleware from './middleware/error.middleware.js';
// Import routes
import userRoutes from './routes/user.routes.js';
import agentRoutes from './routes/agent.routes.js';
import clientsRoutes from './routes/client.routes.js';
import adminsRoutes from './routes/administrateur.routes.js';
import chauffeurRoutes from './routes/chauffeur.routes.js';
import busRoutes from './routes/bus.routes.js';
import maintenanceRoutes from './routes/maintenance.routes.js';
import reservationsRoutes from './routes/reservation.routes.js';
import ticketsRoutes from './routes/ticket.routes.js';
import trajetsRoutes from './routes/trajet.route.js';
import agencyRoutes from './routes/agency.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import reclamationsRoutes from './routes/reclamation.routes.js';
import reportRoutes from './routes/report.routes.js';
// Load env vars
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
//app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
//app.use(morgan('dev'));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/agents',agentRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/admins', adminsRoutes);
app.use('/api/chauffeurs', chauffeurRoutes);
app.use('/api/bus', busRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/reservations', reservationsRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/trajets', trajetsRoutes);
app.use('/api/agencies', agencyRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reclamations', reclamationsRoutes);
app.use('/api/reports', reportRoutes);

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Transportation System API' });
});

// Error middleware
app.use(errorMiddleware);

export default app;