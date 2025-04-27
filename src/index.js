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

    // --- Bước 2: Xử lý ISP + ngày ---
    const rawISP = request.cf?.asOrganization || "unknown-isp";
    const isp = rawISP.replace(/\s+/g, "_"); // Replace space thành _
    const now = new Date(Date.now() + 7 * 60 * 60 * 1000); // UTC+7
    const today = now.toISOString().slice(0, 10); // yyyy-mm-dd
    const key = `${isp}_${today}`;
    const dbURL = `${dbBaseURL}/isp-limits/${encodeURIComponent(key)}.json`;

    // --- Bước 3: Đọc count ---
    let count = 0;
    try {
      const res = await fetch(dbURL);
      const data = await res.json();

      if (data) {
        const lastDate = new Date(data.lastTime + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
        count = (lastDate === today) ? (data.count || 0) : 0;
      }
    } catch (err) {
      count = 0;
    }

    const limit = 5;
    const allowed = count < limit;

    // --- Bước 4: Nếu vượt limit ---
    if (!allowed) {
      return new Response(JSON.stringify({
        allowed: false,
        count,
        isp: rawISP,
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

    // --- Bước 5: Nếu được phép, tăng count ---
    count++;
    await fetch(dbURL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count, lastTime: Date.now() }),
    });

    return new Response(JSON.stringify({
      allowed: true,
      count,
      isp: rawISP,
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
