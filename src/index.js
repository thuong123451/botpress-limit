export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const ip = url.searchParams.get("ip") || request.headers.get("cf-connecting-ip") || "unknown";
    const isp = request.headers.get("cf-isp") || "unknown";

    const now = Date.now();
    const today = new Date().toISOString().slice(0, 10); // yyyy-mm-dd
    const key = `${isp}_${today}`;
    const dbBaseURL = "https://thuong-66f3b-default-rtdb.asia-southeast1.firebasedatabase.app";
    const dbURL = `${dbBaseURL}/isp-limits/${encodeURIComponent(key)}.json`;

    // 1. Fetch current count
    let data = await fetch(dbURL).then(res => res.json()).catch(() => null);
    let count = (data && data.count) || 0;

    // 2. If over 5, block
    if (count >= 5) {
      return new Response(JSON.stringify({
        success: false,
        message: `Limit exceeded for ISP "${isp}"`,
        ip, isp, count
      }), { status: 429, headers: { "Content-Type": "application/json" } });
    }

    // 3. Increase and save back
    count++;
    await fetch(dbURL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count, lastTime: now })
    });

    // 4. Clean old entries (>2 days)
    const cleanupURL = `${dbBaseURL}/isp-limits.json`;
    const allLogs = await fetch(cleanupURL).then(res => res.json()).catch(() => ({}));
    const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000;

    for (const [entryKey, entryValue] of Object.entries(allLogs || {})) {
      if (entryValue.lastTime && entryValue.lastTime < twoDaysAgo) {
        await fetch(`${dbBaseURL}/isp-limits/${encodeURIComponent(entryKey)}.json`, { method: "DELETE" });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Request allowed and logged",
      ip, isp, count
    }), { headers: { "Content-Type": "application/json" } });
  }
}
