 import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  username: String,
  text: String,
  createdAt: { type: Date, default: Date.now }
});

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: String, default: 'By bolger team' },
  authorImage: { type: String }, // URL or base64
  blogImage: { type: String },   // URL or base64
  likes: { type: Number, default: 0 },
  comments: [commentSchema],
  tags: [String], // Added tags field as an array of strings
  createdAt: { type: Date, default: Date.now },
  views: { type: Number, default: 0 } // Track blog views
});
 const Blog = mongoose.model('Blog', blogSchema);
export default Blog;