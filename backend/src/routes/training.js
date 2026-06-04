const r = require('express').Router();
const c = require('../controllers/miscControllers');
const { authenticate, authorize } = require('../middleware/auth');
r.use(authenticate);
r.get('/', c.getAllTraining);
r.post('/', authorize('admin','supervisor'), c.createTraining);
r.delete('/:id', authorize('admin'), c.deleteTraining);
module.exports = r;
