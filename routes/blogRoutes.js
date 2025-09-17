// ✅ Public: Increment blog views
 
 import express from 'express';
import multer from 'multer';
import { storage } from '../utilis/cloudinary.js';
const upload = multer({ storage });
import Blog from '../models/blog.js';
import protect from '../middleware/authMiddleware.js';
const router = express.Router();

// ✅ Public: Get all blogs with optional tag filtering
router.get('/', async (req, res) => {
  try {
    const { tag } = req.query;
    let filter = {};
    
    if (tag) {
      filter.tags = { $in: [tag.toLowerCase()] };
    }
    
    const blogs = await Blog.find(filter).sort({ createdAt: -1 });
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ Public: Get single blog
router.get('/:id', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    res.json(blog);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ Public: Search blogs
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const regex = new RegExp(q, 'i'); // case-insensitive
    const blogs = await Blog.find({ 
      $or: [
        { title: regex }, 
        { content: regex },
        { tags: { $in: [regex] } }
      ] 
    });
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ Public: Sort blogs
router.get('/sort', async (req, res) => {
  try {
    const { by } = req.query;
    let sortOption = { createdAt: -1 }; // default
    
    if (by === 'likes') {
      sortOption = { likes: -1 };
    } else if (by === 'title') {
      sortOption = { title: 1 };
    }
    
    const blogs = await Blog.find().sort(sortOption);
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ Public: Get blogs by tag
router.get('/tag/:tag', async (req, res) => {
  try {
    const { tag } = req.params;
    const blogs = await Blog.find({ 
      tags: { $in: [tag.toLowerCase()] } 
    }).sort({ createdAt: -1 });
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ Public: Get all unique tags
router.get('/tags/all', async (req, res) => {
  try {
    const tags = await Blog.distinct('tags');
    res.json(tags);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ Public: Get popular tags (tags with most blogs)
router.get('/tags/popular', async (req, res) => {
  try {
    const popularTags = await Blog.aggregate([
      { $unwind: '$tags' },
      { $group: { 
        _id: '$tags', 
        count: { $sum: 1 } 
      }},
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    res.json(popularTags);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 🔐 Admin-only: Create blog
router.post('/', protect, async (req, res) => {
  try {
    // Process tags - convert to lowercase and remove duplicates
    if (req.body.tags) {
      req.body.tags = [...new Set(req.body.tags.map(tag => tag.toLowerCase().trim()))];
    }
    
    const blog = new Blog(req.body);
    await blog.save();
    res.status(201).json(blog);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 🔐 Admin-only: Edit blog
router.put('/:id', protect, async (req, res) => {
  try {
    // Process tags - convert to lowercase and remove duplicates
    if (req.body.tags) {
      req.body.tags = [...new Set(req.body.tags.map(tag => tag.toLowerCase().trim()))];
    }
    
    const blog = await Blog.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    res.json(blog);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 🔐 Admin-only: Delete blog
router.delete('/:id', protect, async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    res.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ Public: Add comment
router.post('/:id/comment', async (req, res) => {
  try {
    const { username, text } = req.body;
    
    if (!username || !text) {
      return res.status(400).json({ error: 'Username and text are required' });
    }
    
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    blog.comments.push({ username, text });
    await blog.save();
    
    res.json(blog);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ Public: Like blog
router.post('/:id/like', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    blog.likes += 1;
    await blog.save();
    
    res.json({ likes: blog.likes });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 🔐 Admin-only: Upload image
router.post('/upload', protect, (req, res) => {
  upload.single('image')(req, res, function (err) {
    if (err) {
      console.error('Multer/Cloudinary error:', err);
      return res.status(500).json({ error: 'Image upload failed', details: err.message });
    }
    try {
      res.json({ imageUrl: req.file?.path });
    } catch (err) {
      console.error('Image upload error:', err);
      res.status(500).json({ error: 'Image upload failed', details: err.message });
    }
  });
});
// 🔐 Admin-only: Upload and update blog images (authorImage or blogImage)
router.post('/:id/upload-image', protect, upload.single('image'), async (req, res) => {
  try {
    const { imageType } = req.body; // 'authorImage' or 'blogImage'
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    
    if (imageType !== 'authorImage' && imageType !== 'blogImage') {
      return res.status(400).json({ error: 'Invalid image type. Must be authorImage or blogImage' });
    }
    
    // Update the specific image field
    blog[imageType] = req.file.path;
    await blog.save();
    
    res.json({ 
      message: 'Image uploaded successfully',
      imageUrl: req.file.path,
      updatedBlog: blog 
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ error: 'Image upload failed', details: error.message });
  }
});

router.post('/:id/view', async (req, res) => {
  try {
    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    res.json({ views: blog.views });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});
export default router;