export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const ip = url.searchParams.get("ip") || "unknown";
    const now = Math.floor(Date.now() / 1000);
    const maxPerDay = 5;
    const dbUrl = `https://thuong-66f3b-default-rtdb.asia-southeast1.firebasedatabase.app/limits/${ip}.json`;

    const checkRes = await fetch(dbUrl);
    const data = await checkRes.json() || {};
    const { remaining = maxPerDay, lastTime = 0 } = data;

    // Nếu đã qua 24h
    if (now - lastTime >= 86400) {
      await fetch(dbUrl, {
        method: "PUT",
        body: JSON.stringify({ remaining: maxPerDay - 1, lastTime: now }),
      });
      return new Response(JSON.stringify({ allowed: true, remaining: maxPerDay - 1, lastTime: now }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (remaining > 0) {
      await fetch(dbUrl, {
        method: "PUT",
        body: JSON.stringify({ remaining: remaining - 1, lastTime: now }),
      });
      return new Response(JSON.stringify({ allowed: true, remaining: remaining - 1, lastTime: now }), {
        headers: { "Content-Type": "application/json" },
      });
    } else {
      return new Response(JSON.stringify({ allowed: false, remaining: 0, lastTime }), {
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
