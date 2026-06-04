const pool = require('../config/db');

// ── TASKS ────────────────────────────────────────────────
exports.getAllTasks = async (req, res) => {
  try {
    const { status, priority, assigned_to } = req.query;
    let q = `SELECT t.*, e.name as equipment_name, e.equipment_code,
             u.username as assigned_name, c.username as created_name
             FROM maintenance_tasks t
             LEFT JOIN equipment e ON t.equipment_id=e.equipment_id
             LEFT JOIN users u ON t.assigned_to=u.user_id
             LEFT JOIN users c ON t.created_by=c.user_id WHERE 1=1`;
    const p = [];
    if (status)     { p.push(status);     q += ` AND t.status=$${p.length}`; }
    if (priority)   { p.push(priority);   q += ` AND t.priority=$${p.length}`; }
    if (assigned_to){ p.push(assigned_to); q += ` AND t.assigned_to=$${p.length}`; }
    q += ' ORDER BY CASE t.priority WHEN \'critical\' THEN 1 WHEN \'high\' THEN 2 WHEN \'medium\' THEN 3 ELSE 4 END, t.due_date ASC NULLS LAST';
    res.json((await pool.query(q, p)).rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getOneTask = async (req, res) => {
  try {
    const r = await pool.query(`SELECT t.*, e.name as equipment_name, u.username as assigned_name
      FROM maintenance_tasks t LEFT JOIN equipment e ON t.equipment_id=e.equipment_id
      LEFT JOIN users u ON t.assigned_to=u.user_id WHERE t.task_id=$1`, [req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'Task not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.createTask = async (req, res) => {
  const { title, description, equipment_id, assigned_to, priority, due_date, notes } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });
  try {
    const r = await pool.query(
      `INSERT INTO maintenance_tasks (title,description,equipment_id,assigned_to,created_by,priority,due_date,notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [title, description, equipment_id, assigned_to, req.user.user_id, priority || 'medium', due_date, notes]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateTask = async (req, res) => {
  const { title, description, equipment_id, assigned_to, priority, status, due_date, notes } = req.body;
  const completed_at = status === 'completed' ? new Date() : null;
  try {
    const r = await pool.query(
      `UPDATE maintenance_tasks SET title=$1,description=$2,equipment_id=$3,assigned_to=$4,
       priority=$5,status=$6,due_date=$7,notes=$8,completed_at=COALESCE($9,completed_at)
       WHERE task_id=$10 RETURNING *`,
      [title, description, equipment_id, assigned_to, priority, status, due_date, notes, completed_at, req.params.id]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Task not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deleteTask = async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM maintenance_tasks WHERE task_id=$1 RETURNING *', [req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── WORK ORDERS ──────────────────────────────────────────
exports.getAllWO = async (req, res) => {
  try {
    const { status, type } = req.query;
    let q = `SELECT w.*, e.name as equipment_name, u.username as assigned_name, c.username as created_name
             FROM work_orders w LEFT JOIN equipment e ON w.equipment_id=e.equipment_id
             LEFT JOIN users u ON w.assigned_to=u.user_id LEFT JOIN users c ON w.created_by=c.user_id WHERE 1=1`;
    const p = [];
    if (status) { p.push(status); q += ` AND w.status=$${p.length}`; }
    if (type)   { p.push(type);   q += ` AND w.type=$${p.length}`; }
    q += ' ORDER BY w.created_at DESC';
    res.json((await pool.query(q, p)).rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getOneWO = async (req, res) => {
  try {
    const r = await pool.query(`SELECT w.*, e.name as equipment_name, u.username as assigned_name
      FROM work_orders w LEFT JOIN equipment e ON w.equipment_id=e.equipment_id
      LEFT JOIN users u ON w.assigned_to=u.user_id WHERE w.work_order_id=$1`, [req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'Work order not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.createWO = async (req, res) => {
  const { title, description, equipment_id, assigned_to, priority, type, estimated_hours, due_date } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });
  try {
    const count = await pool.query('SELECT COUNT(*)+1 AS n FROM work_orders');
    const code = `WO-${new Date().getFullYear()}-${String(count.rows[0].n).padStart(3,'0')}`;
    const r = await pool.query(
      `INSERT INTO work_orders (work_order_code,title,description,equipment_id,assigned_to,created_by,priority,type,estimated_hours,due_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [code, title, description, equipment_id, assigned_to, req.user.user_id, priority||'medium', type||'corrective', estimated_hours, due_date]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateWO = async (req, res) => {
  const { title, description, equipment_id, assigned_to, priority, status, type, estimated_hours, actual_hours, due_date } = req.body;
  const completed_at = status === 'completed' ? new Date() : null;
  try {
    const r = await pool.query(
      `UPDATE work_orders SET title=$1,description=$2,equipment_id=$3,assigned_to=$4,priority=$5,
       status=$6,type=$7,estimated_hours=$8,actual_hours=$9,due_date=$10,completed_at=COALESCE($11,completed_at)
       WHERE work_order_id=$12 RETURNING *`,
      [title, description, equipment_id, assigned_to, priority, status, type, estimated_hours, actual_hours, due_date, completed_at, req.params.id]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Work order not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── INVENTORY ────────────────────────────────────────────
exports.getAllInventory = async (req, res) => {
  try {
    res.json((await pool.query('SELECT * FROM inventory ORDER BY quantity ASC')).rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getLowStock = async (req, res) => {
  try {
    res.json((await pool.query('SELECT * FROM inventory WHERE quantity <= reorder_level ORDER BY quantity ASC')).rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.createInventory = async (req, res) => {
  const { name, item_code, category, unit, quantity, reorder_level, unit_cost, supplier, location } = req.body;
  if (!name || !item_code) return res.status(400).json({ error: 'Name and code required' });
  try {
    const r = await pool.query(
      `INSERT INTO inventory (name,item_code,category,unit,quantity,reorder_level,unit_cost,supplier,location)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [name, item_code, category, unit||'pcs', quantity||0, reorder_level||10, unit_cost||0, supplier, location]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateInventory = async (req, res) => {
  const { name, item_code, category, unit, quantity, reorder_level, unit_cost, supplier, location } = req.body;
  try {
    const r = await pool.query(
      `UPDATE inventory SET name=$1,item_code=$2,category=$3,unit=$4,quantity=$5,reorder_level=$6,unit_cost=$7,supplier=$8,location=$9
       WHERE item_id=$10 RETURNING *`,
      [name, item_code, category, unit, quantity, reorder_level, unit_cost, supplier, location, req.params.id]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Item not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.restockInventory = async (req, res) => {
  const { quantity } = req.body;
  if (!quantity || quantity < 1) return res.status(400).json({ error: 'Quantity must be > 0' });
  try {
    const r = await pool.query(
      'UPDATE inventory SET quantity=quantity+$1 WHERE item_id=$2 RETURNING *', [quantity, req.params.id]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Item not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── INCIDENTS ────────────────────────────────────────────
exports.getAllIncidents = async (req, res) => {
  try {
    const { status, severity } = req.query;
    let q = `SELECT i.*, e.name as equipment_name, u.username as reporter_name
             FROM incidents i LEFT JOIN equipment e ON i.equipment_id=e.equipment_id
             LEFT JOIN users u ON i.reported_by=u.user_id WHERE 1=1`;
    const p = [];
    if (status)   { p.push(status);   q += ` AND i.status=$${p.length}`; }
    if (severity) { p.push(severity); q += ` AND i.severity=$${p.length}`; }
    q += ' ORDER BY CASE i.severity WHEN \'critical\' THEN 1 WHEN \'high\' THEN 2 WHEN \'medium\' THEN 3 ELSE 4 END, i.occurred_at DESC';
    res.json((await pool.query(q, p)).rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.createIncident = async (req, res) => {
  const { title, description, equipment_id, severity, location, occurred_at } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });
  try {
    const r = await pool.query(
      `INSERT INTO incidents (title,description,equipment_id,reported_by,severity,location,occurred_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [title, description, equipment_id, req.user.user_id, severity||'medium', location, occurred_at||new Date()]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateIncident = async (req, res) => {
  const { title, description, equipment_id, severity, status, location, resolution } = req.body;
  const resolved_at = status === 'resolved' || status === 'closed' ? new Date() : null;
  try {
    const r = await pool.query(
      `UPDATE incidents SET title=$1,description=$2,equipment_id=$3,severity=$4,status=$5,
       location=$6,resolution=$7,resolved_at=COALESCE($8,resolved_at) WHERE incident_id=$9 RETURNING *`,
      [title, description, equipment_id, severity, status, location, resolution, resolved_at, req.params.id]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Incident not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};
