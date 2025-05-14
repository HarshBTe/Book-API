require('dotenv').config(); // Load environment variables first

const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const Book = require('./models/Book');

const app = express();
app.use(express.json());
const upload = multer({ dest: 'uploads/' });

// 🛠 Get variables from .env
const PORT = process.env.PORT || 3002;
const MONGODB_URI = process.env.MONGODB_URI;

// 🔗 Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// CRUD Endpoints
app.get('/books', async (req, res) => {
  try {
    const books = await Book.find();
    res.json(books);
  } catch (err) {
    console.error('Error fetching books:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/books/:id', async (req, res) => {
  const book = await Book.findOne({ id: req.params.id });
  if (!book) return res.status(404).json({ message: 'Book not found' });
  res.json(book);
});

app.post('/books', async (req, res) => {
  const { title, author, publishedYear } = req.body;
  if (!title || !author || isNaN(publishedYear)) {
    return res.status(400).json({ message: 'Invalid input' });
  }

  const book = new Book({
    id: uuidv4(),
    title,
    author,
    publishedYear: Number(publishedYear)
  });

  await book.save();
  res.status(201).json(book);
});

app.put('/books/:id', async (req, res) => {
  const book = await Book.findOne({ id: req.params.id });
  if (!book) return res.status(404).json({ message: 'Book not found' });

  const { title, author, publishedYear } = req.body;

  book.title = title ?? book.title;
  book.author = author ?? book.author;
  book.publishedYear = publishedYear ?? book.publishedYear;

  await book.save();
  res.json(book);
});

app.delete('/books/:id', async (req, res) => {
  const result = await Book.deleteOne({ id: req.params.id });
  if (result.deletedCount === 0) return res.status(404).json({ message: 'Book not found' });
  res.json({ message: 'Book deleted' });
});

// 📥 CSV Import
app.post('/books/import', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  const content = fs.readFileSync(req.file.path, 'utf8');
  const lines = content.trim().split('\n');
  const errors = [];
  let successCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const [title, author, publishedYear] = lines[i].split(',').map(v => v.trim());

    if (!title || !author || !publishedYear || isNaN(publishedYear)) {
      errors.push({ row: i + 1, error: 'Invalid or missing fields', data: lines[i] });
      continue;
    }

    const book = new Book({
      id: uuidv4(),
      title,
      author,
      publishedYear: Number(publishedYear)
    });

    await book.save();
    successCount++;
  }

  fs.unlinkSync(req.file.path);

  res.json({
    message: 'Import completed',
    booksAdded: successCount,
    errors
  });
});

// 🚀 Start Server
app.listen(PORT, () => {
  console.log(`📚 Book API running on http://localhost:${PORT}`);
});
