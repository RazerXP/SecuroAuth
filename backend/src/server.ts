import "dotenv/config";
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from "path";

import connectDB from './config/db.js';
import authRoutes from './routes/auth.routes.js';

const app = express();
const PORT = process.env.PORT || 3000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const __dirname = path.resolve();

// Middleware
if (process.env.NODE_ENV === "development") {
  app.use(cors({
    origin: CLIENT_URL,
    credentials: true,
  }));
}
app.use(cookieParser());
app.use(express.json());

app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.log("Received request:", req.method, req.url);
  next();
});

app.use('/auth', authRoutes);

if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "../frontend/dist")));

    app.use((req, res) => {
        res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
    });
}


// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack); // always log
  if (process.env.NODE_ENV === 'development') {
    res.status(500).json({ error: err.message, stack: err.stack });
  } else {
    res.status(500).json({ error: 'Something went wrong!' });
  }
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
