const r = require('express').Router();
const c = require('../controllers/mainControllers');
const { authenticate } = require('../middleware/auth');
r.use(authenticate);
r.get('/', c.getAllIncidents);
r.post('/', c.createIncident);
r.put('/:id', c.updateIncident);
module.exports = r;
