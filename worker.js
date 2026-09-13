const APP_PATHS = new Set(["/", "/index.html", "/app-v12", "/app-v12.html"]);

function injectPremiumLayer(html) {
  const headInject = `
<link rel="stylesheet" href="/lastset-theme.css?v=0128">
<link rel="stylesheet" href="/lastset-premium.css?v=0128">
<link rel="stylesheet" href="/lastset-images.css?v=0128">
<link rel="stylesheet" href="/lastset-hotfix.css?v=0128">
<link rel="stylesheet" href="/lastset-calendar.css?v=0128">
<meta name="theme-color" content="#090713">
`;

  const bodyInject = `
<script src="/lastset-enhancements.js?v=0128"></script>
<script src="/lastset-premium.js?v=0128"></script>
<script src="/lastset-hotfix.js?v=0128"></script>
<script src="/lastset-calendar.js?v=0128"></script>
<script src="/lastset-workouts.js?v=0128"></script>
`;

  let output = html;
  if (!output.includes("lastset-theme.css")) {
    output = output.replace("</head>", headInject + "</head>");
  } else {
    if (!output.includes("lastset-hotfix.css")) {
      output = output.replace("</head>", `<link rel="stylesheet" href="/lastset-hotfix.css?v=0128">\n</head>`);
    }
    if (!output.includes("lastset-calendar.css")) {
      output = output.replace("</head>", `<link rel="stylesheet" href="/lastset-calendar.css?v=0128">\n</head>`);
    }
  }

  if (!output.includes("lastset-enhancements.js")) {
    output = output.replace("</body>", bodyInject + "</body>");
  } else {
    if (!output.includes("lastset-hotfix.js")) {
      output = output.replace("</body>", `<script src="/lastset-hotfix.js?v=0128"></script>\n</body>`);
    }
    if (!output.includes("lastset-calendar.js")) {
      output = output.replace("</body>", `<script src="/lastset-calendar.js?v=0128"></script>\n</body>`);
    }
    if (!output.includes("lastset-workouts.js")) {
      output = output.replace("</body>", `<script src="/lastset-workouts.js?v=0128"></script>\n</body>`);
    }
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
