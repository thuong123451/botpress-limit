export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    const dbBaseURL = "https://thuong-66f3b-default-rtdb.asia-southeast1.firebasedatabase.app";

    // --- Bước 1: Auto xóa dữ liệu cũ hơn 2 ngày ---
    try {
      const limitsRes = await fetch(`${dbBaseURL}/isp-limits.json`);
      const limitsData = await limitsRes.json();

      const now = Date.now();
      const twoDaysMs = 2 * 24 * 60 * 60 * 1000;

      if (limitsData) {
        for (const [key, value] of Object.entries(limitsData)) {
          if (value?.lastTime && now - value.lastTime > twoDaysMs) {
            await fetch(`${dbBaseURL}/isp-limits/${encodeURIComponent(key)}.json`, {
              method: "DELETE",
            });
          }
        }
      }
    } catch (err) {
      console.error("Error cleaning old records:", err);
    }
    // --- End Auto clean ---

    const isp = request.cf?.asOrganization || "unknown-isp";
    const now = new Date(Date.now() + 7 * 60 * 60 * 1000); // UTC+7
    const today = now.toISOString().slice(0, 10); // yyyy-mm-dd
    const key = `${isp.replace(/\s+/g, "_")}_${today}`;
    const dbURL = `${dbBaseURL}/isp-limits/${encodeURIComponent(key)}.json`;

    let count = 0;
    try {
      const res = await fetch(dbURL);
      const data = await res.json();
      count = data?.count || 0;
    } catch (err) {
      count = 0;
    }

    const limit = 5;
    const allowed = count < limit;

    if (!allowed) {
      return new Response(JSON.stringify({
        allowed: false,
        count,
        isp,
        message: "Quota exceeded"
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Cache-Control": "no-store, no-cache, must-revalidate",
          "Pragma": "no-cache",
        }
      });
    }

    // Nếu allowed, tăng count
    count++;
    await fetch(dbURL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count, lastTime: Date.now() }),
    });

    return new Response(JSON.stringify({
      allowed: true,
      count,
      isp,
      message: "Request allowed and logged"
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Pragma": "no-cache",
      }
    });
  }
}
