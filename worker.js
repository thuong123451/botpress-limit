export default {
  async fetch(request, env, ctx) {
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const now = Math.floor(Date.now() / 1000); // timestamp giây
    const FIREBASE_URL = "https://thuong-66f3b-default-rtdb.asia-southeast1.firebasedatabase.app";
    const url = `${FIREBASE_URL}/${ip}.json`;

    const resp = await fetch(url);
    const data = await resp.json();

    let remaining = 0;
    let allowed = false;
    let lastTime = now;

    if (!data || !data.remaining || now - data.lastTime > 86400) {
      // Lần đầu hoặc sau 24h, reset lượt
      remaining = 4;
      allowed = true;
    } else if (data.remaining > 0) {
      // Còn lượt
      remaining = data.remaining - 1;
      allowed = true;
    } else {
      // Hết lượt
      remaining = 0;
      allowed = false;
    }

    // Ghi lại trạng thái mới
    const update = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ remaining, lastTime: now })
    });

    return new Response(
      JSON.stringify({ allowed, remaining, lastTime: now }),
      { headers: { "Content-Type": "application/json" } }
    );
  }
};
