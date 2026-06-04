const pool = require('../config/db');

// ── REPORTS ──────────────────────────────────────────────
exports.getSummary = async (req, res) => {
  try {
    const [eq, tasks, wo, inc, lowStock] = await Promise.all([
      pool.query(`SELECT COUNT(*) total, COUNT(*) FILTER (WHERE status='operational') operational,
                  COUNT(*) FILTER (WHERE status='under_maintenance') under_maintenance,
                  COUNT(*) FILTER (WHERE status='out_of_service') out_of_service,
                  ROUND(AVG(health_score),1) avg_health FROM equipment`),
      pool.query(`SELECT COUNT(*) total, COUNT(*) FILTER (WHERE status='pending') pending,
                  COUNT(*) FILTER (WHERE status='in_progress') in_progress,
                  COUNT(*) FILTER (WHERE status='completed') completed,
                  COUNT(*) FILTER (WHERE priority='critical' AND status!='completed') critical_open FROM maintenance_tasks`),
      pool.query(`SELECT COUNT(*) total, COUNT(*) FILTER (WHERE status='open') open,
                  COUNT(*) FILTER (WHERE status='in_progress') in_progress,
                  COUNT(*) FILTER (WHERE status='completed') completed FROM work_orders`),
      pool.query(`SELECT COUNT(*) total, COUNT(*) FILTER (WHERE status='open') open,
                  COUNT(*) FILTER (WHERE severity='critical' AND status='open') critical FROM incidents`),
      pool.query('SELECT COUNT(*) total FROM inventory WHERE quantity <= reorder_level'),
    ]);
    res.json({
      equipment: eq.rows[0],
      tasks: tasks.rows[0],
      work_orders: wo.rows[0],
      incidents: inc.rows[0],
      low_stock: lowStock.rows[0].total,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getEquipmentHealth = async (req, res) => {
  try {
    res.json((await pool.query(
      `SELECT name, equipment_code, type, status, health_score, last_maintenance, next_maintenance
       FROM equipment ORDER BY health_score ASC`
    )).rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getMaintenanceTrend = async (req, res) => {
  try {
    res.json((await pool.query(
      `SELECT DATE(completed_at) as date, COUNT(*) as completed
       FROM maintenance_tasks WHERE status='completed' AND completed_at >= NOW()-INTERVAL '30 days'
       GROUP BY DATE(completed_at) ORDER BY date ASC`
    )).rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── NOTIFICATIONS ────────────────────────────────────────
exports.getMyNotifications = async (req, res) => {
  try {
    res.json((await pool.query(
      'SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50',
      [req.user.user_id]
    )).rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.markRead = async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET is_read=true WHERE user_id=$1 AND notification_id=$2',
      [req.user.user_id, req.params.id]);
    res.json({ message: 'Marked as read' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.markAllRead = async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET is_read=true WHERE user_id=$1', [req.user.user_id]);
    res.json({ message: 'All marked as read' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── TRAINING ─────────────────────────────────────────────
exports.getAllTraining = async (req, res) => {
  try {
    res.json((await pool.query(
      `SELECT t.*, u.username as created_by_name FROM training_resources t
       LEFT JOIN users u ON t.created_by=u.user_id ORDER BY t.created_at DESC`
    )).rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.createTraining = async (req, res) => {
  const { title, description, category, type, url } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  try {
    const r = await pool.query(
      `INSERT INTO training_resources (title,description,category,type,url,created_by) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [title, description, category, type||'document', url, req.user.user_id]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deleteTraining = async (req, res) => {
  try {
    await pool.query('DELETE FROM training_resources WHERE resource_id=$1', [req.params.id]);
    res.json({ message: 'Resource deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── AUDIT ────────────────────────────────────────────────
exports.getAuditLog = async (req, res) => {
  try {
    res.json((await pool.query(
      `SELECT a.*, u.username FROM audit_log a LEFT JOIN users u ON a.user_id=u.user_id
       ORDER BY a.created_at DESC LIMIT 100`
    )).rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── USERS ────────────────────────────────────────────────
exports.getAllUsers = async (req, res) => {
  try {
    res.json((await pool.query('SELECT user_id,username,email,role,status,created_at FROM users ORDER BY created_at DESC')).rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateUser = async (req, res) => {
  const { username, email, role, status } = req.body;
  try {
    const r = await pool.query(
      'UPDATE users SET username=$1,email=$2,role=$3,status=$4 WHERE user_id=$5 RETURNING user_id,username,email,role,status',
      [username, email, role, status, req.params.id]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};
