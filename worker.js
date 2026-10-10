const APP_PATHS = new Set(["/", "/index.html", "/app-v12", "/app-v12.html"]);

const STYLE_TAGS = [
  ["/lastset-theme.css","0138"],
  ["/lastset-premium.css","0138"],
  ["/lastset-images.css","0132"],
  ["/lastset-hotfix.css","0132"],
  ["/lastset-calendar.css","0132"],
  ["/lastset-brand.css","0139"],
  ["/lastset-identity.css","01310"],
  ["/lastset-v0140.css","01402"],
  ["/lastset-onboarding.css","0140"],
  ["/lastset-offline.css","0141"],
  ["/lastset-explore.css","0250"],
  ["/lastset-anatomy.css","0280"]
];

const SCRIPT_TAGS = [
  ["/lastset-enhancements.js","0132"],
  ["/lastset-premium.js","0132"],
  ["/lastset-hotfix.js","0132"],
  ["/lastset-smartlog-shorthand.js","01402"],
  ["/lastset-core-reliability.js","0133"],
  ["/lastset-memory.js","0134"],
  ["/lastset-intelligence.js","0137"],
  ["/lastset-calendar.js","0132"],
  ["/lastset-workouts.js","0132"],
  ["/lastset-integrity.js","0132"],
  ["/lastset-profile-equipment.js","0135"],
  ["/lastset-navigation.js","0141"],
  ["/lastset-beta.js","1beta1"],
  ["/lastset-brand.js","0139"],
  ["/lastset-identity.js","01401"],
  ["/lastset-v0140.js","01402"],
  ["/lastset-onboarding.js","0140"],
  ["/lastset-offline.js","0141"],
  ["/lastset-atlas-regions.js","0280"],
  ["/lastset-anatomy.js","0280"],
  ["/lastset-explore.js","0270"]
];

function injectPremiumLayer(html) {
  let output = html;

  for (const [path, version] of STYLE_TAGS) {
    const name = path.split("/").pop();
    if (!output.includes(name)) {
      output = output.replace("</head>", `<link rel="stylesheet" href="${path}?v=${version}">\n</head>`);
    }
  }

  for (const [path, version] of SCRIPT_TAGS) {
    const name = path.split("/").pop();
    if (!output.includes(name)) {
      output = output.replace("</body>", `<script src="${path}?v=${version}"></script>\n</body>`);
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

      return new Response(html, { status: 200, headers });
    }

    return env.ASSETS.fetch(request);
  }
};
