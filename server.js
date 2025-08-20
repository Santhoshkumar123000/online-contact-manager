// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./src/db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend
app.use(express.static(path.join(__dirname, 'public')));

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT 1 AS ok');
    res.json({ status: 'ok', db: rows[0].ok === 1 });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// Create table if not exists (run at startup)
async function ensureSchema() {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS contacts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) UNIQUE,
      phone VARCHAR(30),
      company VARCHAR(100),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
  await db.query(createTableSQL);
}
ensureSchema().catch(err => {
  console.error("Schema init failed:", err.message);
});

// List contacts with search + pagination
app.get('/api/contacts', async (req, res) => {
  try {
    const search = (req.query.search || '').trim();
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.max(parseInt(req.query.limit || '10', 10), 1);
    const offset = (page - 1) * limit;

    let where = '';
    let params = [];
    if (search) {
      where = `WHERE name LIKE ? OR email LIKE ? OR phone LIKE ?`;
      const like = `%${search}%`;
      params.push(like, like, like);
    }

    const [countRows] = await db.query(`SELECT COUNT(*) AS total FROM contacts ${where}`, params);
    const total = countRows[0].total;

    const [rows] = await db.query(
      `SELECT * FROM contacts ${where} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`,
      params.concat([limit, offset])
    );

    res.json({ data: rows, page, limit, total, pages: Math.ceil(total / limit) });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Get one contact
app.get('/api/contacts/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [rows] = await db.query('SELECT * FROM contacts WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Not found' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Create contact
app.post('/api/contacts', async (req, res) => {
  try {
    const { name, email, phone, company, notes } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: 'Name is required' });
    const [result] = await db.query(
      'INSERT INTO contacts (name, email, phone, company, notes) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), email || null, phone || null, company || null, notes || null]
    );
    const [rows] = await db.query('SELECT * FROM contacts WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e && e.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Email already exists' });
    }
    res.status(500).json({ message: e.message });
  }
});

// Update contact
app.put('/api/contacts/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, email, phone, company, notes } = req.body;
    const [existing] = await db.query('SELECT * FROM contacts WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ message: 'Not found' });

    const updated = {
      name: name !== undefined ? name : existing[0].name,
      email: email !== undefined ? email : existing[0].email,
      phone: phone !== undefined ? phone : existing[0].phone,
      company: company !== undefined ? company : existing[0].company,
      notes: notes !== undefined ? notes : existing[0].notes
    };

    await db.query(
      'UPDATE contacts SET name = ?, email = ?, phone = ?, company = ?, notes = ? WHERE id = ?',
      [updated.name, updated.email, updated.phone, updated.company, updated.notes, id]
    );
    const [rows] = await db.query('SELECT * FROM contacts WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (e) {
    if (e && e.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Email already exists' });
    }
    res.status(500).json({ message: e.message });
  }
});

// Delete contact
app.delete('/api/contacts/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [result] = await db.query('DELETE FROM contacts WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Not found' });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
