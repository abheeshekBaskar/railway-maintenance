const r = require('express').Router();
const c = require('../controllers/equipmentController');
const { authenticate, authorize } = require('../middleware/auth');
r.use(authenticate);
r.get('/', c.getAll); r.get('/:id', c.getOne);
r.post('/', authorize('admin','operator'), c.create);
r.put('/:id', authorize('admin','operator'), c.update);
r.delete('/:id', authorize('admin'), c.remove);
module.exports = r;
