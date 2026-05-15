require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const http = require('http');
const { Server } = require('socket.io');
const crypto = require('crypto');
const path = require('path');
const multer = require('multer');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());
// Udostępnia folder "img" dla całego świata pod adresem /img
app.use('/img', express.static(path.join(__dirname, 'img')));

// --- POŁĄCZENIE Z BAZĄ POSTGRES ---
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'ksiegarnia',
    password: process.env.DB_PASSWORD || 'twoje_haslo',
    port: process.env.DB_PORT || 5432,
});

pool.connect((err) => {
    if (err) console.error('❌ Błąd połączenia z bazą:', err.stack);
    else console.log('✅ Połączono z bazą PostgreSQL!');
});

// --- KONFIGURACJA MULTER (ZDJĘCIA) ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'img/'); 
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// --- STRAŻNIK (Middleware) ---
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(403).json({ message: "Brak tokenu!" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_tajny_klucz');
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Token nieważny!" });
    }
};

// --- OBSŁUGA SOCKETÓW ---
io.on('connection', (socket) => {
    console.log('Połączono z socketem: ' + socket.id);
});

// --- 1. UŻYTKOWNICY I AUTORYZACJA ---

app.post('/ksiegarnia-api/register', async (req, res) => {
    const { email, password, imie, nazwisko } = req.body;
    try {
        const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
        const query = `INSERT INTO users (email, password, first_name, last_name, role) VALUES ($1, $2, $3, $4, 'user')`;
        await pool.query(query, [email, hashedPassword, imie, nazwisko]);
        res.status(201).json({ message: "Rejestracja pomyślna" });
    } catch (err) {
        if (err.code === '23505') res.status(400).json({ message: "Ten e-mail jest już zajęty!" });
        else res.status(500).json({ message: "Błąd rejestracji" });
    }
});

app.post('/ksiegarnia-api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
        const result = await pool.query('SELECT id, email, password, role FROM users WHERE email = $1', [email]);

        if (result.rows.length > 0) {
            const user = result.rows[0];
            if (user.password === hashedPassword) {
                const token = jwt.sign(
                    { id: user.id, role: user.role },
                    process.env.JWT_SECRET || 'super_tajny_klucz',
                    { expiresIn: '1h' }
                );
                return res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
            }
        }
        res.status(401).json({ message: 'Błędne dane logowania' });
    } catch (err) {
        res.status(500).json({ message: 'Błąd serwera' });
    }
});

app.post('/ksiegarnia-api/change-password', async (req, res) => {
    const { userId, oldPass, newPass } = req.body;
    try {
        const user = await pool.query('SELECT password FROM users WHERE id = $1', [userId]);
        const oldHash = crypto.createHash('sha256').update(oldPass).digest('hex');
        if (user.rows[0].password !== oldHash) return res.status(400).json({ message: "Błędne stare hasło!" });

        const newHash = crypto.createHash('sha256').update(newPass).digest('hex');
        await pool.query('UPDATE users SET password = $1 WHERE id = $2', [newHash, userId]);
        res.json({ message: "Hasło zmienione" });
    } catch (err) {
        res.status(500).json({ message: "Błąd serwera" });
    }
});

// --- 2. ZAMÓWIENIA ---

app.post('/ksiegarnia-api/orders', async (req, res) => {
    const { user_id, total_sum, items } = req.body;
    try {
        await pool.query('BEGIN');
        const orderRes = await pool.query(
            'INSERT INTO orders (user_id, total_sum, order_date, status) VALUES ($1, $2, NOW(), $3) RETURNING id',
            [user_id, total_sum, 'W REALIZACJI']
        );
        const orderId = orderRes.rows[0].id;

        for (const item of items) {
            await pool.query('INSERT INTO order_items (order_id, book_id, quantity) VALUES ($1, $2, $3)', [orderId, item.book_id, item.quantity]);
            await pool.query('UPDATE books SET stock = stock - $1 WHERE id = $2', [item.quantity, item.book_id]);
        }
        await pool.query('COMMIT');
        res.status(201).json({ message: "Zamówienie złożone!" });
    } catch (err) {
        await pool.query('ROLLBACK');
        res.status(500).json({ message: "Błąd bazy: " + err.message });
    }
});

app.get('/ksiegarnia-api/my-orders/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await pool.query(`
            SELECT
                id,
                total_sum AS total_price,
                order_date AS created_at,
                status,
                (SELECT string_agg(b.title || ' (x' || oi.quantity || ')', ', ')
                 FROM order_items oi
                 JOIN books b ON oi.book_id = b.id
                 WHERE oi.order_id = o.id) as items_summary
            FROM orders o
            WHERE user_id = $1
            ORDER BY order_date DESC`, [userId]);

        res.json(result.rows);
    } catch (err) {
        console.error("BŁĄD SQL:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// --- 3. KSIĄŻKI (Publiczne i Admin) ---

app.get('/ksiegarnia-api/books', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM books ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/ksiegarnia-api/admin/books', upload.single('foto'), async (req, res) => {
    const { tytul, autor, cena, stock } = req.body;
    const foto = req.file ? req.file.filename : 'default.jpg';

    try {
        await pool.query(
            'INSERT INTO books (title, author, price, stock, image) VALUES ($1, $2, $3, $4, $5)',
            [tytul, autor, cena, stock, foto]
        );
        res.json({ message: "Książka dodana pomyślnie!" });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.put('/ksiegarnia-api/admin/books/:id', async (req, res) => {
    const { price, stock } = req.body;
    try {
        await pool.query('UPDATE books SET price = $1, stock = $2 WHERE id = $3', [price, stock, req.params.id]);
        res.json({ message: "Książka zaktualizowana" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/ksiegarnia-api/admin/books/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM books WHERE id = $1', [req.params.id]);
        res.json({ message: "Książka usunięta" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 4. ADMINISTRACJA ZAMÓWIENIAMI ---

app.get('/ksiegarnia-api/admin/orders', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT o.*, u.email,
            (SELECT string_agg(b.title || ' (x' || oi.quantity || ')', ', ')
             FROM order_items oi JOIN books b ON oi.book_id = b.id
             WHERE oi.order_id = o.id) as items_summary
            FROM orders o
            JOIN users u ON o.user_id = u.id
            ORDER BY o.order_date DESC`);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/ksiegarnia-api/admin/orders/status', async (req, res) => {
    const { orderId, newStatus } = req.body;
    try {
        await pool.query('UPDATE orders SET status = $1 WHERE id = $2', [newStatus, orderId]);
        res.json({ message: "Status zmieniony" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/ksiegarnia-api/admin/orders/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM orders WHERE id = $1', [req.params.id]);
        res.json({ message: "Zamówienie usunięte" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 5. ZARZĄDZANIE UŻYTKOWNIKAMI (Admin) ---

app.get('/ksiegarnia-api/admin/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, email, role FROM users ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/ksiegarnia-api/admin/users/role', async (req, res) => {
    const { userId, newRole } = req.body;
    try {
        await pool.query('UPDATE users SET role = $1 WHERE id = $2', [newRole, userId]);
        res.json({ message: "Rola zmieniona" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/ksiegarnia-api/admin/users/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
        res.json({ message: "Użytkownik usunięty" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- START SERWERA ---
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Serwer działa na http://192.168.254.104:${PORT}/ksiegarnia-api`);
});