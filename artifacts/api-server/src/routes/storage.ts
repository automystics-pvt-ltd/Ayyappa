import { Readable } from 'stream';
import { Router, type IRouter, type Request, type Response } from 'express';

import {
  ObjectNotFoundError,
  ObjectStorageService,
} from '../lib/objectStorage';
import { requireAuth } from '../middlewares/auth';
import { readLocalUpload } from '../lib/localUpload';
import { db } from '@workspace/db';
import { galleryPhotosTable } from '@workspace/db/schema';
import { eq } from 'drizzle-orm';

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();

/**
 * GET /storage/public-objects/*
 *
 * Serve public assets from PUBLIC_OBJECT_SEARCH_PATHS.
 * These are unconditionally public — no authentication or ACL checks.
 * IMPORTANT: Always provide this endpoint when object storage is set up.
 */
router.get(
  '/storage/public-objects/*filePath',
  async (req: Request, res: Response) => {
    try {
      const raw = req.params.filePath;
      const filePath = Array.isArray(raw) ? raw.join('/') : raw;
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        res.status(404).json({ error: 'File not found' });
        return;
      }

      const response = await objectStorageService.downloadObject(file);

      res.status(response.status);
      response.headers.forEach((value, key) => res.setHeader(key, value));

      if (response.body) {
        const nodeStream = Readable.fromWeb(
          response.body as ReadableStream<Uint8Array>,
        );
        nodeStream.pipe(res);
      } else {
        res.end();
      }
    } catch (error) {
      req.log.error({ err: error }, 'Error serving public object');
      res.status(500).json({ error: 'Failed to serve public object' });
    }
  },
);

/**
 * GET /storage/gallery-objects/*
 *
 * Publicly serve gallery photo assets — no auth required.
 * Safety: validates the requested objectPath exists in gallery_photos table
 * so arbitrary private objects cannot be accessed via this endpoint.
 */
router.get('/storage/gallery-objects/*path', async (req: Request, res: Response) => {
  try {
    const raw = req.params.path;
    const wildcardPath = Array.isArray(raw) ? raw.join('/') : raw;
    const objectPath = `/objects/${wildcardPath}`;

    // Confirm this path is a registered gallery photo before serving publicly
    const [photo] = await db
      .select({ id: galleryPhotosTable.id })
      .from(galleryPhotosTable)
      .where(eq(galleryPhotosTable.url, objectPath))
      .limit(1);

    if (!photo) {
      res.status(404).json({ error: 'Gallery photo not found' });
      return;
    }

    const objectFile = await objectStorageService.getObjectEntityFile(objectPath);
    const response = await objectStorageService.downloadObject(objectFile, 3600);

    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));

    if (response.body) {
      const nodeStream = Readable.fromWeb(response.body as ReadableStream<Uint8Array>);
      nodeStream.pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      res.status(404).json({ error: 'Object not found' });
      return;
    }
    req.log.error({ err: error }, 'Error serving gallery object');
    res.status(500).json({ error: 'Failed to serve gallery photo' });
  }
});

/**
 * GET /storage/objects/*
 *
 * Serve private object entities (e.g. donation payment screenshots).
 * Requires admin session — only authenticated admins may view these files.
 */
router.get('/storage/objects/*path', requireAuth, async (req: Request, res: Response) => {
  try {
    const raw = req.params.path;
    const wildcardPath = Array.isArray(raw) ? raw.join('/') : raw;
    const objectPath = `/objects/${wildcardPath}`;
    const objectFile =
      await objectStorageService.getObjectEntityFile(objectPath);

    const response = await objectStorageService.downloadObject(objectFile);

    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));

    if (response.body) {
      const nodeStream = Readable.fromWeb(
        response.body as ReadableStream<Uint8Array>,
      );
      nodeStream.pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      req.log.warn({ err: error }, 'Object not found');
      res.status(404).json({ error: 'Object not found' });
      return;
    }
    req.log.error({ err: error }, 'Error serving object');
    res.status(500).json({ error: 'Failed to serve object' });
  }
});

/**
 * GET /storage/local-uploads/:id
 *
 * Serve locally stored upload files (donation screenshots saved on disk when
 * the Replit GCS sidecar is not available). Requires admin session.
 */
router.get('/storage/local-uploads/:id', requireAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id || !/^[0-9a-f-]{36}$/.test(id)) {
    res.status(400).json({ error: 'Invalid file ID' });
    return;
  }
  const file = await readLocalUpload(id);
  if (!file) {
    res.status(404).json({ error: 'File not found' });
    return;
  }
  res.setHeader('Content-Type', file.contentType);
  res.setHeader('Cache-Control', 'private, max-age=3600');
  res.setHeader('Content-Length', String(file.data.length));
  res.end(file.data);
});

export default router;
