require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require("cors");
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth.routes');
const asyncHandler = require('express-async-handler');


connectDB();


const app = express();
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());


app.get('/', (req, res) => res.send('Yusra: at your ease...'));
app.use('/api/auth', authRoutes);

// Mount new TaskFlow routes
const workspaceRoutes = require('./routes/workspace.routes');
const boardRoutes = require('./routes/board.routes');
const columnRoutes = require('./routes/column.routes');
const cardRoutes = require('./routes/card.routes');


app.use('/api/workspaces', workspaceRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/columns', columnRoutes);
app.use('/api/cards', cardRoutes);


// Error handler
app.use((err, req, res, next) => {
const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
res.status(statusCode).json({ message: err.message, stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));