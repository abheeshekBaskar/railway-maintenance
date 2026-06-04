const r = require('express').Router();
const c = require('../controllers/mainControllers');
const { authenticate, authorize } = require('../middleware/auth');
r.use(authenticate);
r.get('/', c.getAllTasks); r.get('/:id', c.getOneTask);
r.post('/', authorize('admin','supervisor','operator'), c.createTask);
r.put('/:id', c.updateTask);
r.delete('/:id', authorize('admin','supervisor'), c.deleteTask);
module.exports = r;
