import bcrypt from "bcryptjs";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Load .env file from backend folder
dotenv.config({ path: path.join(__dirname, ".env") });

console.log("MONGO_URI from env:", process.env.MONGO_URI);


const app = express();
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.log("❌ MongoDB error:", err));

const PORT = process.env.PORT || 5000;
// ===== Schemas =====
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String
});
const User = mongoose.model("User", userSchema);

const vendorSchema = new mongoose.Schema({
  name: String,
  price: Number,
  url: String,
  stock: Boolean
}, { _id: false })

const componentSchema = new mongoose.Schema({
  // Keep legacy numeric id used by the frontend for selection and comparison
  id: { type: Number, index: true },
  category: { type: String, required: true },
  name: { type: String, required: true },
  brand: String,
  ramType: String,
  formFactor: String,
  cores: Number,
  memory: String,
  capacity: String,
  wattage: Number,
  vendors: [vendorSchema],
  specs: mongoose.Schema.Types.Mixed
}, { timestamps: true })

// Avoid duplicate legacy ids per category
componentSchema.index({ category: 1, id: 1 }, { unique: true, sparse: true })
const Component = mongoose.model("Component", componentSchema);

// ===== Threads (Forum) =====
const replySchema = new mongoose.Schema({
  user: String, // username for simplicity
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: true })

const threadSchema = new mongoose.Schema({
  user: String, // username for simplicity
  title: { type: String, required: true },
  category: { type: String, default: 'General' },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  replies: { type: [replySchema], default: [] }
});
const Thread = mongoose.model("Thread", threadSchema);

// ===== Saved Builds =====
const savedBuildSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  items: { type: mongoose.Schema.Types.Mixed, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})
savedBuildSchema.pre('save', function(next){ this.updatedAt = new Date(); next(); })
const SavedBuild = mongoose.model('SavedBuild', savedBuildSchema)

// ===== Auth middleware =====
function authMiddleware(req, res, next){
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return res.status(401).json({ error: 'Unauthorized' });
  try{
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  }catch(err){
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// ===== Routes =====

// Register
app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;
  const existingUser = await User.findOne({ username });
  if (existingUser) return res.status(400).json({ error: "User exists" });

  const hash = await bcrypt.hash(password, 10);
  await User.create({ username, password: hash });
  res.json({ message: "Registration successful" });
});

// Login
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ error: "User not found" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: "Invalid password" });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "2h" });
  res.json({ message: "Login successful", token });
});

// Add component (accept full shape)
app.post("/api/components", async (req, res) => {
  try {
    const component = await Component.create(req.body);
    res.json(component);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get components (optional ?category=cpu)
app.get("/api/components", async (req, res) => {
  const { category } = req.query;
  const q = category ? { category } : {};
  const components = await Component.find(q).lean();
  res.json(components);
});

// ===== Thread routes =====
// List threads (optionally filter by category)
app.get('/api/threads', async (req, res) => {
  const { category } = req.query;
  const q = category ? { category } : {};
  const threads = await Thread.find(q).sort({ createdAt: -1 }).lean();
  res.json(threads);
});

// Create thread (auth required)
app.post('/api/threads', authMiddleware, async (req, res) => {
  const { title, category = 'General', content } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Missing title or content' });
  const username = req.body.user || (await User.findById(req.user.id).then(u=>u?.username).catch(()=>null)) || 'Unknown';
  const doc = await Thread.create({ user: username, title, category, content });
  res.json(doc);
});

// Delete thread (auth required, only author can delete)
app.delete('/api/threads/:id', authMiddleware, async (req, res) => {
  const id = req.params.id;
  const th = await Thread.findById(id);
  if (!th) return res.status(404).json({ error: 'Not found' });
  const username = await User.findById(req.user.id).then(u=>u?.username).catch(()=>null);
  if (!username || th.user !== username) return res.status(403).json({ error: 'Forbidden' });
  await Thread.deleteOne({ _id: id });
  res.json({ ok: true });
});

// Get single thread with replies
app.get('/api/threads/:id', async (req, res) => {
  const id = req.params.id
  const th = await Thread.findById(id).lean()
  if (!th) return res.status(404).json({ error: 'Not found' })
  res.json(th)
})

// Add a reply (auth required)
app.post('/api/threads/:id/replies', authMiddleware, async (req, res) => {
  const id = req.params.id
  const { content } = req.body
  if (!content || !content.trim()) return res.status(400).json({ error: 'Reply cannot be empty' })
  const th = await Thread.findById(id)
  if (!th) return res.status(404).json({ error: 'Not found' })
  const username = await User.findById(req.user.id).then(u=>u?.username).catch(()=>null) || 'Unknown'
  th.replies.push({ user: username, content: content.trim() })
  await th.save()
  res.json({ ok: true, reply: th.replies[th.replies.length-1] })
})

// ===== Saved Build routes =====
// List current user's saved builds
app.get('/api/saved-builds', authMiddleware, async (req, res) => {
  const builds = await SavedBuild.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean()
  res.json(builds)
})

// Create a new saved build
app.post('/api/saved-builds', authMiddleware, async (req, res) => {
  try{
    const { name, items } = req.body
    if (!name || !items) return res.status(400).json({ error: 'Missing name or items' })
    // Ensure plain JSON data to avoid any Mongoose Document leakage
    const safeItems = JSON.parse(JSON.stringify(items))
    const doc = await SavedBuild.create({ userId: req.user.id, name, items: safeItems })
    res.json(doc)
  }catch(err){
    res.status(400).json({ error: err.message || 'Failed to save build' })
  }
})

// Update a saved build (rename or replace items)
app.put('/api/saved-builds/:id', authMiddleware, async (req, res) => {
  const { id } = req.params
  const { name, items } = req.body
  const update = { updatedAt: new Date() }
  if (typeof name === 'string') update.name = name
  if (items) update.items = items
  const doc = await SavedBuild.findOneAndUpdate({ _id: id, userId: req.user.id }, { $set: update }, { new: true }).lean()
  if (!doc) return res.status(404).json({ error: 'Not found' })
  res.json(doc)
})

// Delete a saved build
app.delete('/api/saved-builds/:id', authMiddleware, async (req, res) => {
  const { id } = req.params
  const r = await SavedBuild.deleteOne({ _id: id, userId: req.user.id })
  if (!r.deletedCount) return res.status(404).json({ error: 'Not found' })
  res.json({ ok: true })
})

// Export the app for Vercel serverless
export default app;

// Only start server if not in serverless environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}
