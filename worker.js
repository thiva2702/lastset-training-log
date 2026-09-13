export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // LastSet keeps the original application in /index.html and uses
    // /app-v12.html as the premium bootstrap. Route only the site root
    // through the bootstrap while allowing all other assets to be served
    // directly from Cloudflare's static asset layer.
    if (url.pathname === "/") {
      url.pathname = "/app-v12.html";
      return env.ASSETS.fetch(new Request(url.toString(), request));
    }

    return env.ASSETS.fetch(request);
  }
};
