require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../src/config/db');

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`TRUNCATE audit_log, notifications, training_resources, inventory_usage,
      incidents, work_orders, maintenance_tasks, inventory, equipment, users RESTART IDENTITY CASCADE`);

    // Users
    const hashes = await Promise.all([
      bcrypt.hash('Admin@123', 10), bcrypt.hash('Super@123', 10),
      bcrypt.hash('Oper@123', 10),  bcrypt.hash('Tech@123', 10),
    ]);
    const ur = await client.query(`
      INSERT INTO users (username, email, password_hash, role) VALUES
        ('admin',      'admin@railway.com',      $1, 'admin'),
        ('supervisor', 'supervisor@railway.com', $2, 'supervisor'),
        ('operator1',  'operator@railway.com',   $3, 'operator'),
        ('tech1',      'tech@railway.com',       $4, 'technician')
      RETURNING user_id`, hashes);
    console.log('✅ Users seeded');

    // Equipment
    const er = await client.query(`
      INSERT INTO equipment (name, equipment_code, type, manufacturer, model, serial_number, location, status, health_score, last_maintenance, next_maintenance) VALUES
        ('Locomotive RM-001',   'LOCO-001', 'locomotive',     'GE Transportation', 'ES44AC',    'SN-10021', 'Yard A', 'operational',       88, NOW()-INTERVAL '30 days', NOW()+INTERVAL '60 days'),
        ('Locomotive RM-002',   'LOCO-002', 'locomotive',     'EMD',               'SD70ACe',   'SN-10022', 'Yard B', 'under_maintenance',  45, NOW()-INTERVAL '5 days',  NOW()+INTERVAL '5 days'),
        ('Freight Car FC-101',  'FC-101',   'freight_car',    'Trinity Rail',      'Box 60ft',  'SN-20101', 'Track 3','operational',       92, NOW()-INTERVAL '15 days', NOW()+INTERVAL '75 days'),
        ('Freight Car FC-102',  'FC-102',   'freight_car',    'Trinity Rail',      'Flat 68ft', 'SN-20102', 'Track 4','operational',       78, NOW()-INTERVAL '20 days', NOW()+INTERVAL '40 days'),
        ('Signal SIG-205',      'SIG-205',  'signal',         'Siemens',           'SpeedSignal','SN-30205','Junction 5','out_of_service', 20, NOW()-INTERVAL '60 days', NOW()-INTERVAL '5 days'),
        ('Track Section T-12',  'TRK-012',  'track',          'Internal',          'Heavy Rail','SN-40012', 'Section 12','operational',    95, NOW()-INTERVAL '10 days', NOW()+INTERVAL '90 days'),
        ('Control Tower CT-01', 'CT-001',   'infrastructure', 'Alstom',            'ETCS L2',   'SN-50001', 'Central', 'operational',      82, NOW()-INTERVAL '45 days', NOW()+INTERVAL '45 days'),
        ('Freight Car FC-103',  'FC-103',   'freight_car',    'Greenbrier',        'Tank 60ft', 'SN-20103', 'Track 7','operational',       65, NOW()-INTERVAL '35 days', NOW()+INTERVAL '15 days')
      RETURNING equipment_id`);
    console.log('✅ Equipment seeded');

    const [adminId, supId, opId, techId] = ur.rows.map(r => r.user_id);
    const eqIds = er.rows.map(r => r.equipment_id);

    // Maintenance Tasks
    await client.query(`
      INSERT INTO maintenance_tasks (title, description, equipment_id, assigned_to, created_by, priority, status, due_date) VALUES
        ('Engine oil replacement',         'Replace engine oil and filter per schedule',          ${eqIds[0]}, ${techId}, ${supId}, 'medium',   'pending',     NOW()+INTERVAL '3 days'),
        ('Brake system overhaul',          'Full brake system inspection and overhaul',           ${eqIds[1]}, ${techId}, ${supId}, 'critical',  'in_progress', NOW()+INTERVAL '1 day'),
        ('Wheel bearing inspection',       'Inspect and lubricate all wheel bearings',            ${eqIds[2]}, ${techId}, ${opId},  'medium',   'pending',     NOW()+INTERVAL '7 days'),
        ('Signal light replacement',       'Replace faulty signal LEDs at Junction 5',            ${eqIds[4]}, ${techId}, ${supId}, 'critical',  'in_progress', NOW()),
        ('Track alignment check',          'Verify track alignment at section 12',                ${eqIds[5]}, ${opId},   ${adminId},'low',      'completed',   NOW()-INTERVAL '2 days'),
        ('ETCS software update',           'Apply latest firmware update to control tower',       ${eqIds[6]}, ${opId},   ${adminId},'high',     'pending',     NOW()+INTERVAL '5 days'),
        ('Coupling mechanism inspection',  'Inspect and test all coupling mechanisms on FC-102',  ${eqIds[3]}, ${techId}, ${supId}, 'medium',   'pending',     NOW()+INTERVAL '10 days'),
        ('Tank car seal inspection',       'Inspect all seals on tank car FC-103',                ${eqIds[7]}, ${techId}, ${supId}, 'high',     'pending',     NOW()+INTERVAL '14 days')
    `);
    console.log('✅ Tasks seeded');

    // Work Orders
    const wor = await client.query(`
      INSERT INTO work_orders (work_order_code, title, description, equipment_id, assigned_to, created_by, priority, status, type, estimated_hours, due_date) VALUES
        ('WO-2024-001', 'Emergency signal repair',       'Immediate repair of Signal SIG-205',            ${eqIds[4]}, ${techId}, ${adminId}, 'critical', 'in_progress', 'emergency',   4,  NOW()+INTERVAL '1 day'),
        ('WO-2024-002', 'Scheduled loco maintenance',    'Full scheduled maintenance for LOCO-002',       ${eqIds[1]}, ${techId}, ${supId},   'high',     'approved',    'preventive',  16, NOW()+INTERVAL '5 days'),
        ('WO-2024-003', 'Freight car brake check',       'Routine brake inspection FC-101',               ${eqIds[2]}, ${opId},   ${supId},   'medium',   'open',        'inspection',  3,  NOW()+INTERVAL '7 days'),
        ('WO-2024-004', 'Track section survey',          'Annual survey and measurement of section 12',   ${eqIds[5]}, ${opId},   ${adminId}, 'low',      'completed',   'inspection',  8,  NOW()-INTERVAL '3 days'),
        ('WO-2024-005', 'Control system firmware patch', 'Apply security patch to ETCS L2 system',       ${eqIds[6]}, ${opId},   ${adminId}, 'high',     'open',        'corrective',  2,  NOW()+INTERVAL '4 days'),
        ('WO-2024-006', 'Tank car leak investigation',   'Investigate potential seal issue FC-103',       ${eqIds[7]}, ${techId}, ${supId},   'high',     'open',        'corrective',  5,  NOW()+INTERVAL '2 days')
      RETURNING work_order_id`);
    console.log('✅ Work orders seeded');

    // Inventory
    await client.query(`
      INSERT INTO inventory (name, item_code, category, unit, quantity, reorder_level, unit_cost, supplier, location) VALUES
        ('Engine Oil 15W-40 (5L)',     'INV-001', 'Lubricants',    'can',  45, 10, 28.50,  'LubeCo Supplies',     'Store A-1'),
        ('Brake Pad Set (Heavy Rail)', 'INV-002', 'Brake Parts',   'set',   8,  5, 320.00, 'RailParts Inc.',      'Store B-2'),
        ('Signal LED Module',          'INV-003', 'Electronics',   'pcs',  22,  8, 75.00,  'Siemens Parts',       'Store C-1'),
        ('Wheel Bearing 180mm',        'INV-004', 'Mechanical',    'pcs',  15,  6, 145.00, 'SKF Railways',        'Store B-1'),
        ('Track Bolt M24 (Box 100)',   'INV-005', 'Fasteners',     'box',  30, 10, 42.00,  'SteelFix Ltd.',       'Store D-1'),
        ('Hydraulic Fluid ISO 46',     'INV-006', 'Lubricants',    'ltr',  80, 20, 12.50,  'LubeCo Supplies',     'Store A-2'),
        ('Coupling Pin Set',           'INV-007', 'Mechanical',    'set',   6,  4, 280.00, 'RailParts Inc.',      'Store B-3'),
        ('Safety Gloves (Box 12)',     'INV-008', 'Safety',        'box',  20,  5,  18.00, 'SafetyFirst Co.',     'Store E-1'),
        ('Cable Ties Assorted (500)',  'INV-009', 'Consumables',   'bag',  35, 10,   8.00, 'ElecSupplies Ltd.',   'Store C-2'),
        ('Grease Cartridge 400g',      'INV-010', 'Lubricants',    'pcs',   3, 10,  14.00, 'LubeCo Supplies',     'Store A-1'),
        ('Air Filter Heavy Duty',      'INV-011', 'Engine Parts',  'pcs',   4,  5,  95.00, 'FilterPro Railways',  'Store B-2'),
        ('Track Inspection Torch',     'INV-012', 'Tools',         'pcs',   7,  3,  65.00, 'ToolMaster Ltd.',     'Store E-2')
    `);
    console.log('✅ Inventory seeded');

    // Incidents
    await client.query(`
      INSERT INTO incidents (title, description, equipment_id, reported_by, severity, status, location, occurred_at, resolution) VALUES
        ('Signal SIG-205 complete failure',   'Signal completely failed during peak hours causing delays', ${eqIds[4]}, ${opId},   'critical', 'investigating', 'Junction 5', NOW()-INTERVAL '2 days',  NULL),
        ('LOCO-002 unusual vibration',        'Technician reported excessive vibration at high speed',    ${eqIds[1]}, ${techId}, 'high',     'open',          'Yard B',     NOW()-INTERVAL '4 days',  NULL),
        ('FC-103 minor seal leak detected',   'Small leak found on tank car during routine inspection',   ${eqIds[7]}, ${techId}, 'medium',   'open',          'Track 7',    NOW()-INTERVAL '1 day',   NULL),
        ('Track misalignment section 10',     'Minor misalignment detected during survey',                NULL,        ${opId},   'low',      'resolved',      'Section 10', NOW()-INTERVAL '10 days', 'Track realigned and bolts tightened'),
        ('Control tower power fluctuation',   'Brief power fluctuation caused system restart',            ${eqIds[6]}, ${opId},   'medium',   'resolved',      'Central',    NOW()-INTERVAL '7 days',  'UPS replaced and wiring inspected')
    `);
    console.log('✅ Incidents seeded');

    // Notifications
    await client.query(`
      INSERT INTO notifications (user_id, title, message, type) VALUES
        (${techId},  'New task assigned',          'You have been assigned: Brake system overhaul on LOCO-002',      'info'),
        (${supId},   'Critical incident reported', 'Signal SIG-205 complete failure reported at Junction 5',         'alert'),
        (${adminId}, 'Work order requires approval','WO-2024-003 is awaiting your approval',                         'warning'),
        (${techId},  'Low inventory alert',         'Grease Cartridge stock is below reorder level (3 remaining)',   'warning'),
        (${opId},    'Work order completed',        'WO-2024-004 Track section survey has been marked complete',     'success'),
        (${supId},   'Overdue maintenance',         'Signal SIG-205 is overdue for scheduled maintenance',           'alert'),
        (${adminId}, 'New incident opened',         'FC-103 minor seal leak has been reported — please review',      'info')
    `);
    console.log('✅ Notifications seeded');

    // Training Resources
    await client.query(`
      INSERT INTO training_resources (title, description, category, type, url, created_by) VALUES
        ('Locomotive Maintenance Manual v4.2',        'Complete guide for scheduled and corrective locomotive maintenance',        'Locomotives',    'document', '/docs/loco-manual.pdf',         ${adminId}),
        ('Signal System Troubleshooting Guide',       'Step-by-step troubleshooting for common signal failures',                  'Signals',        'guide',    '/docs/signal-troubleshoot.pdf', ${adminId}),
        ('Safety Procedures for Track Inspection',    'Mandatory safety procedures before and during track inspection activities', 'Safety',         'procedure','/docs/track-safety.pdf',        ${supId}),
        ('Work Order Management — How To',            'Guide for creating, assigning, and closing work orders in the system',     'System Usage',   'guide',    '/docs/work-order-guide.pdf',    ${adminId}),
        ('Predictive Maintenance Concepts',           'Introduction to predictive maintenance and reading health scores',          'Maintenance',    'document', '/docs/predictive-maint.pdf',    ${supId}),
        ('Emergency Response Procedures',             'Protocols for handling critical incidents and equipment failures',          'Safety',         'procedure','/docs/emergency.pdf',           ${adminId})
    `);
    console.log('✅ Training resources seeded');

    await client.query('COMMIT');
    console.log('\n🎉 Seed completed!');
    console.log('   Admin:      admin@railway.com      / Admin@123');
    console.log('   Supervisor: supervisor@railway.com / Super@123');
    console.log('   Operator:   operator@railway.com   / Oper@123');
    console.log('   Technician: tech@railway.com       / Tech@123');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}
seed();
