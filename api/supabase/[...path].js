const DEFAULT_SUPABASE_INTERNAL_URL =
  'http://supabasekong-a5tg2fvpwj6emkewfdknamid.187.77.159.209.sslip.io';

export default async function handler(req, res) {
  const internalUrl = process.env.SUPABASE_INTERNAL_URL || DEFAULT_SUPABASE_INTERNAL_URL;
  const pathParts = Array.isArray(req.query?.path)
    ? req.query.path
    : req.query?.path
      ? [req.query.path]
      : [];
  const path = pathParts.map((part) => encodeURIComponent(part)).join('/');
  const query = new URLSearchParams(req.query || {});
  query.delete('path');

  const target = `${internalUrl.replace(/\/$/, '')}/${path}${query.toString() ? `?${query}` : ''}`;
  const headers = new Headers();

  for (const header of ['accept', 'accept-profile', 'authorization', 'content-profile', 'content-type', 'prefer', 'range', 'x-client-info']) {
    const value = req.headers[header];
    if (value) headers.set(header, Array.isArray(value) ? value.join(',') : value);
  }

  let body;
  if (!['GET', 'HEAD'].includes(req.method)) {
    body = typeof req.body === 'string' ? req.body : req.body ? JSON.stringify(req.body) : undefined;
  }

  try {
    const upstream = await fetch(target, {
      method: req.method,
      headers,
      body,
    });

    res.statusCode = upstream.status;
    upstream.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'content-encoding') res.setHeader(key, value);
    });
    res.send(Buffer.from(await upstream.arrayBuffer()));
  } catch (error) {
    console.error('Supabase proxy failed:', error);
    res.status(502).json({ error: 'Supabase proxy request failed' });
  }
}
