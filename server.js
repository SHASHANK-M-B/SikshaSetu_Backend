require('dotenv').config({ quiet: true });
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const authRoutes = require('./Auth/routes/authRoutes');
const organizationRoutes = require('./Organization/routes/organizationRoutes');
const teacherRoutes = require('./Teacher/routes/teacherRoutes');
const studentRoutes = require('./Student/routes/studentRoutes');
const adminRoutes = require('./Admin/routes/adminRoutes');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(cors({
  origin: true,
  credentials: true
}));

app.use('/api/auth', authRoutes);
app.use('/api/organization', organizationRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
  res.send('SikshaSetu Backend');
});

const PORT = process.env.PORT || 8928;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});