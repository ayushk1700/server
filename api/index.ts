import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();

// 1. Configure CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

// --- YOUR ROUTES ---
app.get('/users', (req: Request, res: Response) => {
  res.json({ message: "Hello from the Vercel TypeScript Backend!" });
});
// -------------------

// 2. Export the app for Vercel, but allow local listening
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

// 3. IMPORTANT: Export default for TypeScript/ES Modules
export default app;