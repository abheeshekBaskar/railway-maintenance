const r = require('express').Router();
const c = require('../controllers/miscControllers');
const { authenticate, authorize } = require('../middleware/auth');
r.use(authenticate, authorize('admin'));
r.get('/', c.getAuditLog);
module.exports = r;
