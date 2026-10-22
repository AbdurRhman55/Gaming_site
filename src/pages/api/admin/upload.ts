import type { APIRoute } from 'astro';
import { isAuthed, jsonError, jsonOk } from '../../../lib/auth';
import { saveUpload, UploadError } from '../../../lib/uploads';

/** Cover-image upload (multipart form field: "file"). */
export const POST: APIRoute = async ({ request, cookies }) => {
  if (!isAuthed(cookies)) return jsonError(401, 'Sign in first.');
  try {
    const saved = await saveUpload(request);
    return jsonOk({ ...saved });
  } catch (e) {
    const status = e instanceof UploadError ? 400 : 500;
    return jsonError(status, e instanceof Error ? e.message : 'Upload failed.');
  }
};
