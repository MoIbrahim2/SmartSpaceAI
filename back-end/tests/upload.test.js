const { fileFilter } = require('../src/middlewares/upload.middleware');
const ApiError = require('../src/errors/ApiError');
const HTTP_STATUS = require('../src/constants/statusCodes');

describe('First Guard - Image Upload Extension Validation', () => {
  const allowedExtensions = ['jpeg', 'jpg', 'png', 'bmp', 'webp'];
  const disallowedExtensions = ['gif', 'svg', 'tiff', 'pdf', 'exe', 'txt', 'zip'];

  allowedExtensions.forEach((ext) => {
    it(`should allow .${ext} extension`, (done) => {
      const mockReq = {};
      const mockFile = {
        originalname: `sample_image.${ext}`,
        mimetype: `image/${ext === 'jpg' ? 'jpeg' : ext}`
      };

      fileFilter(mockReq, mockFile, (err, accept) => {
        expect(err).toBeNull();
        expect(accept).toBe(true);
        done();
      });
    });

    it(`should allow upper-case .${ext.toUpperCase()} extension`, (done) => {
      const mockReq = {};
      const mockFile = {
        originalname: `SAMPLE_IMAGE.${ext.toUpperCase()}`,
        mimetype: `image/${ext === 'jpg' ? 'jpeg' : ext}`
      };

      fileFilter(mockReq, mockFile, (err, accept) => {
        expect(err).toBeNull();
        expect(accept).toBe(true);
        done();
      });
    });
  });

  disallowedExtensions.forEach((ext) => {
    it(`should reject .${ext} extension with a clear validation error`, (done) => {
      const mockReq = {};
      const mockFile = {
        originalname: `unsupported_file.${ext}`,
        mimetype: ext === 'gif' || ext === 'svg' ? `image/${ext}` : 'application/octet-stream'
      };

      fileFilter(mockReq, mockFile, (err, accept) => {
        expect(err).toBeInstanceOf(ApiError);
        expect(err.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
        expect(err.message).toMatch(/Invalid file extension/);
        expect(accept).toBe(false);
        done();
      });
    });
  });

  it('should reject file without extension', (done) => {
    const mockReq = {};
    const mockFile = {
      originalname: 'filename_without_ext',
      mimetype: 'image/jpeg'
    };

    fileFilter(mockReq, mockFile, (err, accept) => {
      expect(err).toBeInstanceOf(ApiError);
      expect(err.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(err.message).toMatch(/Invalid file extension/);
      expect(accept).toBe(false);
      done();
    });
  });
});
