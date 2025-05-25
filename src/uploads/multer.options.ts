import { Options as MulterOptions } from 'multer';
import * as multer from 'multer';

export const multerOptions: MulterOptions = {
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB
    },
};