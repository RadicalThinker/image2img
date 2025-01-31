const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const sharp = require('sharp');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
fs.mkdir(uploadsDir, { recursive: true }).catch(console.error);

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/imageConverter')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Image Schema
const imageSchema = new mongoose.Schema({
  originalName: String,
  convertedName: String,
  format: String,
  size: Number,
  createdAt: { type: Date, default: Date.now }
});

const Image = mongoose.model('Image', imageSchema);

// Multer configuration
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only images are allowed'));
      return;
    }
    cb(null, true);
  }
});

// Routes
app.post('/api/convert', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    const { targetFormat } = req.body;
    if (!['jpeg', 'png', 'webp'].includes(targetFormat)) {
      return res.status(400).json({ error: 'Invalid target format' });
    }

    const timestamp = Date.now();
    const outputFilename = `converted-${timestamp}.${targetFormat}`;
    const outputPath = path.join(__dirname, 'uploads', outputFilename);

    // Convert image using sharp
    const processedImage = await sharp(req.file.buffer)
      .toFormat(targetFormat)
      .toFile(outputPath);

    // Save to database
    const image = new Image({
      originalName: req.file.originalname,
      convertedName: outputFilename,
      format: targetFormat,
      size: processedImage.size
    });
    await image.save();

    res.json({
      success: true,
      convertedImage: `/uploads/${outputFilename}`,
      message: 'Image converted successfully'
    });
  } catch (error) {
    console.error('Conversion error:', error);
    res.status(500).json({ error: 'Error converting image' });
  }
});

app.get('/api/history', async (req, res) => {
  try {
    const history = await Image.find().sort({ createdAt: -1 }).limit(10);
    res.json(history);
  } catch (error) {
    console.error('History fetch error:', error);
    res.status(500).json({ error: 'Error fetching history' });
  }
});

app.delete('/api/images/:id', async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Delete file from uploads
    const filePath = path.join(__dirname, 'uploads', image.convertedName);
    await fs.unlink(filePath).catch(() => console.log('File already deleted'));

    // Delete from database
    await Image.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Error deleting image' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});