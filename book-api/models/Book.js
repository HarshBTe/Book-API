const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  id: { type: String, required: true }, // UUID
  title: { type: String, required: true },
  author: { type: String, required: true },
  publishedYear: { type: Number, required: true }
});

module.exports = mongoose.model('Book', bookSchema);
