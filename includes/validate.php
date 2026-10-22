<?php
declare(strict_types=1);

/**
 * Game input validation shared by the create/update API (PHP port of
 * src/lib/validate.ts + src/lib/embed.ts). Everything is trimmed and
 * length-capped; nothing raw reaches a page. Throws on bad input.
 */

/** Turn a pasted URL or <iframe> embed code into a single validated URL. */
function pf_parse_embed(string $rawInput): string
{
    $raw = trim($rawInput);
    if ($raw === '') {
        throw new InvalidArgumentException('Paste a game URL or an <iframe> embed code.');
    }
    $url = $raw;
    if (stripos($raw, '<iframe') !== false) {
        if (!preg_match('/<iframe[^>]*?\ssrc\s*=\s*(?:"([^"]+)"|\'([^\']+)\'|([^\s>]+))/i', $raw, $m)) {
            throw new InvalidArgumentException('No src="…" was found inside the iframe code.');
        }
        $url = trim($m[1] !== '' ? $m[1] : ($m[2] !== '' ? $m[2] : $m[3]));
    }
    return pf_validate_embed_url($url);
}

/** Internal paths (our own embed pages) or https:// URLs only. */
function pf_validate_embed_url(string $url): string
{
    // Internal path: a single leading slash — "//host" (protocol-relative) rejected.
    if (str_starts_with($url, '/') && !str_starts_with($url, '//')) {
        return $url;
    }
    $parts = parse_url($url);
    if ($parts === false || empty($parts['scheme']) || empty($parts['host'])) {
        throw new InvalidArgumentException('That is not a valid URL.');
    }
    if (strtolower((string) $parts['scheme']) !== 'https') {
        throw new InvalidArgumentException('Game URLs must use https:// (or an internal /path on this site).');
    }
    return $url;
}

function pf_str(mixed $value, int $max): string
{
    return mb_substr(trim((string) ($value ?? '')), 0, $max, 'UTF-8');
}

/** "Label | Value" lines (form) or [{label,value}] (JSON). Max 12 rows. */
function pf_parse_specs(mixed $raw): array
{
    if (is_array($raw)) {
        $out = [];
        foreach ($raw as $s) {
            $label = pf_str(is_array($s) ? ($s['label'] ?? '') : '', 60);
            $value = pf_str(is_array($s) ? ($s['value'] ?? '') : '', 160);
            if ($label !== '' && $value !== '') {
                $out[] = ['label' => $label, 'value' => $value];
            }
        }
        return array_slice($out, 0, 12);
    }
    if (is_string($raw)) {
        $out = [];
        foreach (preg_split('/\r?\n/', $raw) ?: [] as $line) {
            $parts = explode('|', $line);
            $label = pf_str($parts[0] ?? '', 60);
            $rest = implode('|', array_slice($parts, 1));
            $value = pf_str($rest, 160);
            if ($label !== '' && $value !== '') {
                $out[] = ['label' => $label, 'value' => $value];
            }
        }
        return array_slice($out, 0, 12);
    }
    return [];
}

function pf_parse_tags(mixed $raw): array
{
    $s = is_array($raw) ? implode(',', $raw) : (string) ($raw ?? '');
    $seen = [];
    $out = [];
    foreach (explode(',', $s) as $t) {
        $t = pf_str($t, 32);
        if ($t === '' || isset($seen[$t])) {
            continue;
        }
        $seen[$t] = true;
        $out[] = $t;
    }
    return array_slice($out, 0, 10);
}

function pf_parse_cover(mixed $raw): ?string
{
    $v = pf_str($raw, 512);
    if ($v === '') {
        return null;
    }
    if (!str_starts_with($v, '/uploads/')) {
        throw new InvalidArgumentException('Cover must be an uploaded /uploads/… image.');
    }
    return $v;
}

/** Validate + normalise a game payload from the dashboard (or the API). */
function pf_validate_game_input(mixed $raw): array
{
    $body = is_array($raw) ? $raw : [];

    $title = pf_str($body['title'] ?? '', 80);
    if ($title === '') {
        throw new InvalidArgumentException('Title is required.');
    }

    $description = pf_str($body['description'] ?? '', 600);
    if (mb_strlen($description, 'UTF-8') < 10) {
        throw new InvalidArgumentException('Description is required (at least 10 characters).');
    }

    // Either "embedUrl" (URL) or "embedCode" (pasted iframe) may be supplied.
    $embedRaw = pf_str($body['embedUrl'] ?? '', 4000) ?: pf_str($body['embedCode'] ?? '', 8000);
    $embedUrl = pf_parse_embed($embedRaw);

    return [
        'title'       => $title,
        'description' => $description,
        'category'    => pf_str($body['category'] ?? '', 40) ?: 'arcade',
        'tags'        => pf_parse_tags($body['tags'] ?? ''),
        'controls'    => pf_str($body['controls'] ?? '', 400),
        'specs'       => pf_parse_specs($body['specs'] ?? ''),
        'cover'       => pf_parse_cover($body['cover'] ?? null),
        'embedUrl'    => $embedUrl,
        'status'      => ($body['status'] ?? '') === 'draft' ? 'draft' : 'published',
        'featured'    => ($body['featured'] ?? false) === true
            || $body['featured'] === 'true'
            || $body['featured'] === 'on'
            || $body['featured'] === '1'
            || $body['featured'] === 1,
    ];
}
