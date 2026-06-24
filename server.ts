import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { StudyMaterial, CircularNotification, UserComment } from './src/types';
import { INITIAL_MATERIALS, INITIAL_CIRCULARS } from './src/data';

const app = express();
const PORT = 3000;

// High body limits to support uploading documents, images, and notes as Base64 JSON
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Paths
const DATA_DIR = path.join(process.cwd(), 'data');
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Database schema outline
interface DatabaseSchema {
  materials: StudyMaterial[];
  circulars: CircularNotification[];
  comments: UserComment[];
}

// Initialize database with premium pre-populated PU board circulars and reference materials
let db: DatabaseSchema = {
  materials: INITIAL_MATERIALS,
  circulars: INITIAL_CIRCULARS,
  comments: []
};

// Guard database reading
function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const loaded = JSON.parse(content);
      if (loaded.materials && loaded.circulars && loaded.comments) {
        db = loaded;
      }
    } else {
      saveDatabase();
    }
  } catch (error) {
    console.error('Error loading file database, falling back to in-memory.', error);
  }
}

function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving database file.', error);
  }
}

// Initial Load
loadDatabase();

// --- REST API ENDPOINTS ---

// circulars
app.get('/api/circulars', (req, res) => {
  res.json(db.circulars);
});

// assets / study materials
app.get('/api/materials', (req, res) => {
  res.json(db.materials);
});

// POST to upload a material
app.post('/api/materials', (req, res) => {
  try {
    const {
      title,
      description,
      subject,
      className,
      stream,
      category,
      modulePartition,
      uploader,
      uploaderEmail,
      fileName,
      fileType,
      fileSize,
      fileBase64
    } = req.body;

    if (!title || !subject || !className || !stream || !category || !fileName || !fileBase64) {
      return res.status(400).json({ error: 'Missing core material data directories.' });
    }

    const materialId = `mat-${Date.now()}`;
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const localFileName = `${materialId}_${sanitizedFileName}`;
    const localFilePath = path.join(UPLOADS_DIR, localFileName);

    // Save base64 file to disk
    const base64Data = fileBase64.split(';base64,').pop() || fileBase64;
    fs.writeFileSync(localFilePath, base64Data, { encoding: 'base64' });

    // Store in DB config
    const newMaterial: StudyMaterial = {
      id: materialId,
      title,
      description: description || 'No core description provided.',
      subject,
      className,
      stream,
      category,
      modulePartition: modulePartition || 'Whole Syllabus',
      uploader: uploader || 'Student Contributor',
      uploaderEmail: uploaderEmail || 'anonymous@pucircle.org',
      uploadDate: new Date().toISOString().split('T')[0],
      fileSize: fileSize || '1.0 MB',
      fileType: fileType || 'pdf',
      fileName: sanitizedFileName,
      filePath: localFileName,
      downloadUrl: `/api/download/${materialId}`,
      likes: 0,
      downloads: 0,
      isCustom: true
    };

    db.materials.unshift(newMaterial);
    saveDatabase();

    res.status(201).json(newMaterial);
  } catch (error: any) {
    console.error('Core file upload handler errored out:', error);
    res.status(500).json({ error: 'Server failed to process file storage. Please check formatting.' });
  }
});

// Like a study material
app.post('/api/materials/:id/like', (req, res) => {
  const { id } = req.params;
  const material = db.materials.find(m => m.id === id);
  if (!material) {
    return res.status(404).json({ error: 'Material not found' });
  }
  material.likes += 1;
  saveDatabase();
  res.json({ id: material.id, likes: material.likes });
});

// GET Comments
app.get('/api/comments', (req, res) => {
  const { targetId } = req.query;
  if (targetId) {
    const filtered = db.comments.filter(c => c.targetId === targetId);
    return res.json(filtered);
  }
  res.json(db.comments);
});

// POST to create a comment
app.post('/api/comments', (req, res) => {
  const { targetId, author, authorEmail, text } = req.body;
  
  if (!targetId || !author || !text) {
    return res.status(400).json({ error: 'Missing mandatory comment fields (targetId, author, text)' });
  }

  const newComment: UserComment = {
    id: `comm-${Date.now()}`,
    targetId,
    author,
    authorEmail: authorEmail || 'anonymous@pucircle.org',
    text,
    createdAt: new Date().toISOString()
  };

  db.comments.push(newComment);
  saveDatabase();

  res.status(201).json(newComment);
});

// DELETE /api/materials/:id
app.delete('/api/materials/:id', (req, res) => {
  const { id } = req.params;
  const index = db.materials.findIndex(m => m.id === id);
  if (index !== -1) {
    db.materials.splice(index, 1);
    // Also clear associated comments
    db.comments = db.comments.filter(c => c.targetId !== id);
    saveDatabase();
    return res.json({ success: true });
  }
  res.status(404).json({ error: 'Material not found' });
});

// DELETE /api/circulars/:id
app.delete('/api/circulars/:id', (req, res) => {
  const { id } = req.params;
  const index = db.circulars.findIndex(c => c.id === id);
  if (index !== -1) {
    db.circulars.splice(index, 1);
    saveDatabase();
    return res.json({ success: true });
  }
  res.status(404).json({ error: 'Circular not found' });
});

// POST /api/clear-demos
app.post('/api/clear-demos', (req, res) => {
  db.materials = db.materials.filter(m => m.isCustom === true);
  db.circulars = [];
  db.comments = db.comments.filter(c => !c.targetId.startsWith('mat-') && c.targetId !== 'general');
  saveDatabase();
  res.json({ success: true });
});

// Download service with on-the-fly construction of text sheets for simulation papers
app.get('/api/download/:id', (req, res) => {
  const { id } = req.params;
  const material = db.materials.find(m => m.id === id);

  if (!material) {
    return res.status(404).send('Resource material not found.');
  }

  // Increment download counter
  material.downloads += 1;
  saveDatabase();

  // If custom-uploaded file exists on disk
  if (material.isCustom && material.filePath) {
    const fullPath = path.join(UPLOADS_DIR, material.filePath);
    if (fs.existsSync(fullPath)) {
      res.setHeader('Content-Disposition', `attachment; filename="${material.fileName}"`);
      // Infer content type
      let contentType = 'application/octet-stream';
      if (material.fileType === 'pdf') contentType = 'application/pdf';
      else if (material.fileType === 'jpg' || material.fileType === 'jpeg') contentType = 'image/jpeg';
      else if (material.fileType === 'png') contentType = 'image/png';
      else if (material.fileType === 'txt') contentType = 'text/plain';
      
      res.setHeader('Content-Type', contentType);
      return res.sendFile(fullPath);
    }
  }

  // Pre-populated files or missing file fallback: Generate a helpful companion study guide in textual layout on the fly!
  const textContent = `
========================================
           PU CIRCLE ARCHIVES
       LEARNING ENABLER DOWNLOADS
========================================

RESOURCE DETAIL:
- Title: ${material.title}
- Grade Node: ${material.className} (${material.stream} Stream)
- Subject: ${material.subject}
- Category: ${material.category}
- Curator: ${material.uploader} (${material.uploaderEmail})
- Date Issued: ${material.uploadDate}
- File Handle: ${material.fileName}

--------------------------------------------------
DOCUMENT INSIGHTS & EXPLANATORY SYNOPSIS:
--------------------------------------------------
${material.description}

This document acts as a high-yield study aid mapping Karnataka Pre-University curriculum specifications. 
Use this to prepare for examinations. Study carefully to master standard blueprints!

========================================
Thank you for using PU Circle.
Support our student collective: Share resources, 
questions, and blueprints to help each other excel.
========================================
  `.trim();

  const finalFilename = material.fileName 
    ? (material.fileName.endsWith('.txt') ? material.fileName : `${material.fileName}.txt`)
    : 'study_guide.txt';

  res.setHeader('Content-Disposition', `attachment; filename="${finalFilename}"`);
  res.setHeader('Content-Type', 'text/plain');
  res.send(textContent);
});


// Start server process
async function startServer() {
  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production build static asset routing
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PU Circle Full-Stack Server listening at http://0.0.0.0:${PORT}`);
  });
}

startServer();
