export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Xử lý preflight request (OPTIONS)
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    const isp = request.cf?.asOrganization || "unknown-isp";
    const now = new Date(Date.now() + 7 * 60 * 60 * 1000); // UTC+7
    const today = now.toISOString().slice(0, 10); // yyyy-mm-dd
    const key = `${isp.replace(/\s+/g, "_")}_${today}`;
    const dbBaseURL = "https://thuong-66f3b-default-rtdb.asia-southeast1.firebasedatabase.app";
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
      // Vẫn trả HTTP 200 OK, chỉ trả allowed: false
      return new Response(JSON.stringify({
        allowed: false,
        count,
        isp,
        message: "Quota exceeded"
      }), {
        status: 200,  // <-- luôn 200 OK
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
