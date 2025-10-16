declare module "multer" {
  import type { Request, RequestHandler } from "express";

  type FileCallback<T> = (error: Error | null, value?: T) => void;

  interface UploadedFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination: string;
    filename: string;
    path: string;
    buffer: Buffer;
  }

  interface StorageEngine {
    _handleFile(req: Request, file: UploadedFile, callback: FileCallback<Partial<UploadedFile>>): void;
    _removeFile(req: Request, file: UploadedFile, callback: FileCallback<void>): void;
  }

  interface DiskStorageOptions {
    destination?:
      | string
      | ((req: Request, file: UploadedFile, callback: FileCallback<string>) => void);
    filename?: (req: Request, file: UploadedFile, callback: FileCallback<string>) => void;
  }

  interface MulterOptions {
    storage?: StorageEngine;
    limits?: Record<string, unknown>;
    fileFilter?: (req: Request, file: UploadedFile, callback: FileCallback<boolean>) => void;
  }

  interface MulterInstance {
    single(fieldname: string): RequestHandler;
    array(fieldname: string, maxCount?: number): RequestHandler;
    fields(fields: { name: string; maxCount?: number }[]): RequestHandler;
    any(): RequestHandler;
    none(): RequestHandler;
  }

  interface MulterModule {
    (options?: MulterOptions): MulterInstance;
    diskStorage(options?: DiskStorageOptions): StorageEngine;
    memoryStorage(): StorageEngine;
  }

  const multer: MulterModule;
  export = multer;
}
