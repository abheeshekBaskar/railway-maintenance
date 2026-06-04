const r = require('express').Router();
const c = require('../controllers/mainControllers');
const { authenticate, authorize } = require('../middleware/auth');
r.use(authenticate);
r.get('/', c.getAllWO); r.get('/:id', c.getOneWO);
r.post('/', authorize('admin','supervisor','operator'), c.createWO);
r.put('/:id', c.updateWO);
module.exports = r;
