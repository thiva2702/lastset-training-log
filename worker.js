const APP_PATHS = new Set(["/", "/index.html", "/app-v12", "/app-v12.html"]);

function injectPremiumLayer(html) {
  const headInject = `
<link rel="stylesheet" href="/lastset-theme.css?v=0122">
<link rel="stylesheet" href="/lastset-premium.css?v=0122">
<link rel="stylesheet" href="/lastset-images.css?v=0122">
<meta name="theme-color" content="#090713">
`;

  const bodyInject = `
<script src="/lastset-enhancements.js?v=0122"></script>
<script src="/lastset-premium.js?v=0122"></script>
`;

  let output = html;
  if (!output.includes("lastset-theme.css")) {
    output = output.replace("</head>", headInject + "</head>");
  }
  if (!output.includes("lastset-enhancements.js")) {
    output = output.replace("</body>", bodyInject + "</body>");
  }
  output = output.replace(
    '<meta name="theme-color" content="#0b1220" />',
    '<meta name="theme-color" content="#090713" />'
  );
  return output;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Cloudflare normalizes HTML asset URLs, so the old app-v12 bootstrap could
    // fetch /index.html, be redirected to /, and load itself forever.
    // Serve the real application HTML directly from the Worker and inject the
    // premium LastSet layer server-side instead of using document.write().
    if (request.method === "GET" && APP_PATHS.has(url.pathname)) {
      const assetUrl = new URL(request.url);
      assetUrl.pathname = "/index.html";
      assetUrl.search = "";

      const assetResponse = await env.ASSETS.fetch(
        new Request(assetUrl.toString(), {
          method: "GET",
          headers: request.headers
        })
      );

      if (!assetResponse.ok) return assetResponse;

      const html = injectPremiumLayer(await assetResponse.text());
      const headers = new Headers(assetResponse.headers);
      headers.set("content-type", "text/html; charset=utf-8");
      headers.set("cache-control", "no-store, max-age=0");

      return new Response(html, {
        status: 200,
        headers
      });
    }

    return env.ASSETS.fetch(request);
  }
};
