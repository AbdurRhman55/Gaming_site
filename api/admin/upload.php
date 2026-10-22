<?php
declare(strict_types=1);

/**
 * POST /api/admin/upload/ — cover-image upload (multipart form field: "file").
 *
 * SVG uploads are deliberately rejected: an inline SVG served from our origin
 * can execute script, so only raster formats are accepted. Oversized rasters
 * are downscaled to a 1600px longest edge with GD so a multi-megabyte camera
 * export can't wreck LCP on the library (PHP port of src/lib/uploads.ts).
 */

require_once __DIR__ . '/../../includes/boot.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    pf_json_error(405, 'method not allowed');
}
if (!pf_is_authed()) {
    pf_json_error(401, 'Sign in first.');
}

const PF_MAX_UPLOAD_BYTES = 8 * 1024 * 1024;   // 8 MB
const PF_MAX_EDGE = 1600;                       // covers render at a few hundred CSS px
const PF_TARGET_BYTES = 400 * 1024;             // at/below this, already web-sized

/** Allowed raster mime → file extension. */
function pf_upload_mime(): array
{
    return [
        'image/jpeg' => '.jpg',
        'image/png'  => '.png',
        'image/webp' => '.webp',
        'image/gif'  => '.gif',
        'image/avif' => '.avif',
    ];
}

/**
 * Downscale/re-encode an uploaded raster. Returns the optimized bytes, or
 * null when the original should be kept (already small, animated, or
 * GD can't decode/encode it) — an optimization problem can never fail an
 * upload, and we never make the file bigger.
 */
function pf_optimize_cover(string $tmp, string $mime, int $origBytes): ?string
{
    // GIF may be animated and AVIF rarely benefits from a re-encode — keep as-is.
    if ($mime === 'image/gif' || $mime === 'image/avif') {
        return null;
    }
    if (!function_exists('getimagesize')) {
        return null;
    }
    $info = @getimagesize($tmp);
    if ($info === false || empty($info[0]) || empty($info[1])) {
        return null;
    }
    [$w, $h] = [$info[0], $info[1]];
    if ($w <= PF_MAX_EDGE && $h <= PF_MAX_EDGE && $origBytes <= PF_TARGET_BYTES) {
        return null;
    }

    $src = match ($mime) {
        'image/png'  => @imagecreatefrompng($tmp),
        'image/webp' => function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($tmp) : false,
        default      => @imagecreatefromjpeg($tmp),
    };
    if ($src === false) {
        return null;
    }

    $scale = min(1, PF_MAX_EDGE / max($w, $h));
    $tw = max(1, (int) round($w * $scale));
    $th = max(1, (int) round($h * $scale));
    $dst = imagecreatetruecolor($tw, $th);
    if ($dst === false) {
        imagedestroy($src);
        return null;
    }
    imagealphablending($dst, false);
    imagesavealpha($dst, true);
    $transparent = imagecolorallocatealpha($dst, 0, 0, 0, 127);
    imagefilledrectangle($dst, 0, 0, $tw, $th, (int) $transparent);
    imagecopyresampled($dst, $src, 0, 0, 0, 0, $tw, $th, $w, $h);
    imagedestroy($src);

    $out = null;
    if ($mime === 'image/png') {
        ob_start();
        imagepng($dst, null, 9);
        $out = (string) ob_get_clean();
    } elseif ($mime === 'image/webp' && function_exists('imagewebp')) {
        ob_start();
        imagewebp($dst, null, 82);
        $out = (string) ob_get_clean();
    } else {
        ob_start();
        imagejpeg($dst, null, 82);
        $out = (string) ob_get_clean();
    }
    imagedestroy($dst);

    // Never make the file bigger than what the operator sent.
    if ($out === '' || strlen($out) >= $origBytes) {
        return null;
    }
    return $out;
}

try {
    if (empty($_FILES['file'])) {
        pf_json_error(400, 'No "file" field in the form.');
    }
    $f = $_FILES['file'];
    if (($f['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        pf_json_error(400, 'The upload did not complete (PHP error ' . (int) $f['error'] . ').');
    }
    $origBytes = (int) $f['size'];
    if ($origBytes === 0) {
        pf_json_error(400, 'The uploaded file is empty.');
    }
    if ($origBytes > PF_MAX_UPLOAD_BYTES) {
        pf_json_error(400, 'Images must be 8 MB or smaller.');
    }

    // Trust the detected type over the client-supplied one.
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = (string) $finfo->file($f['tmp_name']);
    $ext = pf_upload_mime()[$mime] ?? null;
    if ($ext === null) {
        pf_json_error(400, 'Unsupported file type. Use JPG, PNG, WebP, GIF or AVIF.');
    }

    $dir = dirname(__DIR__) . '/uploads';
    if (!is_dir($dir) && !mkdir($dir, 0755, true)) {
        pf_json_error(500, 'Could not create the uploads directory.');
    }
    // base36 timestamp (sortable) + random suffix; strip the '.' microtime
    // decimal point or base_convert() emits a deprecation warning (PHP 8.1+).
    $stamp = base_convert(str_replace('.', '', sprintf('%.6F', microtime(true))), 10, 36);
    $filename = 'g-' . $stamp . '-' . bin2hex(random_bytes(4)) . $ext;

    $stored = pf_optimize_cover((string) $f['tmp_name'], $mime, $origBytes);
    if ($stored !== null) {
        if (file_put_contents($dir . '/' . $filename, $stored) === false) {
            pf_json_error(500, 'Could not write the uploaded file.');
        }
        $bytes = strlen($stored);
    } else {
        if (!move_uploaded_file((string) $f['tmp_name'], $dir . '/' . $filename)) {
            pf_json_error(500, 'Could not store the uploaded file.');
        }
        $bytes = $origBytes;
    }

    // Trailing slash mirrors the original /uploads/[file] route's canonical shape.
    pf_json_ok([
        'url'      => '/uploads/' . $filename . '/',
        'filename' => $filename,
        'bytes'    => $bytes,
    ]);
} catch (Throwable $e) {
    pf_json_error(500, $e->getMessage() !== '' ? $e->getMessage() : 'Upload failed.');
}
