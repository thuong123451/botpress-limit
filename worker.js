const FIREBASE_URL = 'https://thuong-66f3b-default-rtdb.asia-southeast1.firebasedatabase.app';
const LIMIT_PER_DAY = 5;

export default {
  async fetch(request, env, ctx) {
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const now = Math.floor(Date.now() / 1000);
    const url = `${FIREBASE_URL}/${ip}.json`;

    const resp = await fetch(url);
    const data = await resp.json();

    if (!data || !data.remaining || now - data.lastTime > 86400) {
      await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remaining: LIMIT_PER_DAY - 1, lastTime: now }),
      });

      return new Response(JSON.stringify({ allowed: true, remaining: LIMIT_PER_DAY - 1, lastTime: now }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (data.remaining > 0) {
      const remaining = data.remaining - 1;
      await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remaining, lastTime: now }),
      });

      return new Response(JSON.stringify({ allowed: true, remaining, lastTime: now }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ allowed: false, remaining: 0, lastTime: data.lastTime }), {
      headers: { "Content-Type": "application/json" },
    });
  },
};
