import express from 'express';
import multer from 'multer';
import {
  uploadInvites,
  sendInvites,
  sendSMSInvites,
  getInviteStats,
  getInviteList
} from '../controllers/formInviteController.js';
import {
  uploadWhatsAppInvites,
  sendWhatsAppInvites
} from '../controllers/whatsappController.js';
import { authenticate, teacherOrAdmin, adminOnly } from '../middleware/auth.js';

const router = express.Router({ mergeParams: true });

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.mimetype === 'text/csv') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel/CSV files are allowed'), false);
    }
  }
});



// Routes
router.post('/upload',
  authenticate,
  adminOnly,
  upload.single('file'),
  uploadInvites
);

router.post('/send',
  authenticate,
  adminOnly,
  sendInvites
);

router.post('/whatsapp/upload',
  authenticate,
  adminOnly,
  upload.single('file'),
  uploadWhatsAppInvites
);

router.post('/whatsapp/send',
  authenticate,
  adminOnly,
  sendWhatsAppInvites
);

// SMS routes
router.post('/sms/send',
  authenticate,
  adminOnly,
  sendSMSInvites
);

router.get('/stats',
  authenticate,
  adminOnly,
  getInviteStats
);
// Add to your formInviteRoutes.js
router.get('/',
  authenticate,
  adminOnly,
  getInviteList
);

export default router;