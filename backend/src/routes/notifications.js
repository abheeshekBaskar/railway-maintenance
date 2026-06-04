const r = require('express').Router();
const c = require('../controllers/miscControllers');
const { authenticate } = require('../middleware/auth');
r.use(authenticate);
r.get('/', c.getMyNotifications);
r.put('/mark-all-read', c.markAllRead);
r.put('/:id/read', c.markRead);
module.exports = r;
