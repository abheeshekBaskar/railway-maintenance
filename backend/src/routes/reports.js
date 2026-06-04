const r = require('express').Router();
const c = require('../controllers/miscControllers');
const { authenticate } = require('../middleware/auth');
r.use(authenticate);
r.get('/summary', c.getSummary);
r.get('/equipment-health', c.getEquipmentHealth);
r.get('/maintenance-trend', c.getMaintenanceTrend);
module.exports = r;
