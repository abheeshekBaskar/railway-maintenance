require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const pool = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Auto-migrate
async function initDB() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, '../migrations/schema.sql'), 'utf8');
    await pool.query(sql);
    console.log('✅ Database schema ready');
  } catch (err) {
    console.error('⚠️  Schema init warning:', err.message);
  }
}

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use('/api/auth',          require('./routes/auth'));
app.use('/api/equipment',     require('./routes/equipment'));
app.use('/api/tasks',         require('./routes/tasks'));
app.use('/api/work-orders',   require('./routes/workOrders'));
app.use('/api/inventory',     require('./routes/inventory'));
app.use('/api/incidents',     require('./routes/incidents'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/reports',       require('./routes/reports'));
app.use('/api/training',      require('./routes/training'));
app.use('/api/audit',         require('./routes/audit'));
app.use('/api/users',         require('./routes/users'));

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, next) => res.status(500).json({ error: err.message }));

initDB().then(() => app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`)));
