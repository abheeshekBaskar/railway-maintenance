const pool = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    const { status, type, search } = req.query;
    let q = 'SELECT * FROM equipment WHERE 1=1';
    const p = [];
    if (status) { p.push(status); q += ` AND status=$${p.length}`; }
    if (type)   { p.push(type);   q += ` AND type=$${p.length}`; }
    if (search) { p.push(`%${search}%`); q += ` AND (name ILIKE $${p.length} OR equipment_code ILIKE $${p.length})`; }
    q += ' ORDER BY created_at DESC';
    const r = await pool.query(q, p);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getOne = async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM equipment WHERE equipment_id=$1', [req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'Equipment not found' });
    // recent tasks
    const tasks = await pool.query(
      `SELECT t.*, u.username as assigned_name FROM maintenance_tasks t
       LEFT JOIN users u ON t.assigned_to=u.user_id
       WHERE t.equipment_id=$1 ORDER BY t.created_at DESC LIMIT 5`, [req.params.id]);
    res.json({ ...r.rows[0], recent_tasks: tasks.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.create = async (req, res) => {
  const { name, equipment_code, type, manufacturer, model, serial_number, location, notes, next_maintenance } = req.body;
  if (!name || !equipment_code || !type) return res.status(400).json({ error: 'Name, code, and type are required' });
  try {
    const r = await pool.query(
      `INSERT INTO equipment (name,equipment_code,type,manufacturer,model,serial_number,location,notes,next_maintenance)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [name, equipment_code, type, manufacturer, model, serial_number, location, notes, next_maintenance]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.update = async (req, res) => {
  const { name, equipment_code, type, manufacturer, model, serial_number, location, status, health_score, notes, next_maintenance } = req.body;
  try {
    const r = await pool.query(
      `UPDATE equipment SET name=$1,equipment_code=$2,type=$3,manufacturer=$4,model=$5,
       serial_number=$6,location=$7,status=$8,health_score=$9,notes=$10,next_maintenance=$11
       WHERE equipment_id=$12 RETURNING *`,
      [name, equipment_code, type, manufacturer, model, serial_number, location, status, health_score, notes, next_maintenance, req.params.id]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Equipment not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.remove = async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM equipment WHERE equipment_id=$1 RETURNING *', [req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'Equipment not found' });
    res.json({ message: 'Equipment deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
