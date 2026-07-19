const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/podrozowka\.lovable\.app$/,
  /^https:\/\/podrozowka\.pl$/,
  /^https:\/\/www\.podrozowka\.pl$/,
  /^http:\/\/localhost(:\d+)?$/,
  /^https:\/\/.*\.run\.app$/,
  /^https:\/\/.*\.lovable\.app$/,
];

export function isOriginAllowed(origin: string): boolean {
  return ALLOWED_ORIGIN_PATTERNS.some(pattern => pattern.test(origin));
}

export function buildCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const allowOrigin = isOriginAllowed(origin) ? origin : "https://podrozowka.lovable.app";
  
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
    "Vary": "Origin",
  };
}
