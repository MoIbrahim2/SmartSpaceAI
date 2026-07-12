const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ApiError = require('../errors/ApiError');
const HTTP_STATUS = require('../constants/statusCodes');

const uploadDir = path.join(__dirname, '../../uploads');

// Ensure the upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    let prefix = 'file';
    if (file.fieldname === 'coverImage') {
      prefix = 'apartment';
    } else if (file.fieldname === 'profileImage') {
      prefix = 'profile';
    } else if (file.fieldname === 'sourceImages') {
      prefix = 'room';
    } else if (file.fieldname === 'images') {
      prefix = 'generation';
    }
    cb(null, `${prefix}-${uniqueSuffix}${ext}`);
  }
});

// Filter out non-image files
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid file type. Only images are allowed.'), false);
  }
};

// Initialize multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

const uploadProfileImage = upload.single('profileImage');
const uploadCoverImage = upload.single('coverImage');
const uploadRoomSourceImages = upload.array('sourceImages', 10);
const uploadGenerationImages = upload.array('images', 10);

module.exports = {
  uploadProfileImage,
  uploadCoverImage,
  uploadRoomSourceImages,
  uploadGenerationImages,
  upload
};
