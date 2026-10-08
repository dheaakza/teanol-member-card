require('dotenv').config();
const express = require('express');
const path = require('path');
const db = require('./config/db');
const membersRouter = require('./routes/members');
const purchasesRouter = require('./routes/purchases');
const rewardsRouter = require('./routes/rewards');
const redemptionsRouter = require('./routes/redemptions');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Clean URL: Redirect page requests directly to clean SPA root http://localhost:3000
app.get(['/index.html', '/purchase.html', '/redeem.html', '/scan.html', '/purchase', '/redeem', '/scan'], (req, res) => {
  res.redirect(301, '/');
});

// Static files (form, css, logo)
app.use(express.static(path.join(__dirname, 'public')));

// Folder tempat kartu PDF hasil generate disimpan & bisa diakses/diunduh
app.use('/cards', express.static(path.join(__dirname, 'generated_cards')));

// API Routes
app.use('/api/members', membersRouter);
app.use('/api/purchases', purchasesRouter);
app.use('/api/rewards', rewardsRouter);
app.use('/api/redemptions', redemptionsRouter);

app.listen(PORT, async () => {
  console.log('=================================================');
  console.log('  TEANOL Member Card System');
  console.log(`  Server berjalan di: http://localhost:${PORT}`);
  console.log('=================================================');

  if (db.initDb) {
    await db.initDb();
  }
});

