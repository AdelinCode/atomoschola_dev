import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/database.js';
import authRoutes from './routes/auth.js';
import subjectRoutes from './routes/subjects.js';
import lessonRoutes from './routes/lessons.js';
import userRoutes from './routes/users.js';
import inviteCodeRoutes from './routes/inviteCodes.js';
import searchRoutes from './routes/search.js';
import adminRoutes from './routes/admin.js';
import statsRoutes from './routes/stats.js';
import pendingRequestsRoutes from './routes/pendingRequests.js';
import notificationsRoutes from './routes/notifications.js';
import commissionRoutes from './routes/commission.js';
import editorCommissionRoutes from './routes/editorCommission.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware - permite acces de oriunde
app.use(cors({
  origin: '*',
  credentials: false
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend (only in development)
if (process.env.NODE_ENV !== 'production') {
  app.use(express.static(path.join(__dirname, '..', 'frontend')));
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/users', userRoutes);
app.use('/api/invite-codes', inviteCodeRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/pending-requests', pendingRequestsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/commission', commissionRoutes);
app.use('/api/editor-commission', editorCommissionRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// Serve frontend for all other routes (only in development)
if (process.env.NODE_ENV !== 'production') {
  app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
  });
} else {
  // In production, return 404 for non-API routes
  app.get('*', (req, res) => {
      res.status(404).json({ 
          success: false, 
          message: 'Route not found. This is an API-only server.' 
      });
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

app.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`📱 Frontend: http://localhost:${PORT}`);
    console.log(`🔌 API: http://localhost:${PORT}/api\n`);
});
