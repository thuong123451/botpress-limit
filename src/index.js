export default {
  async fetch(request, env, ctx) {
    const isp = request.cf?.asOrganization || "unknown-isp";
    
    const now = new Date();
    const vnTime = new Date(now.getTime() + 7 * 60 * 60 * 1000); // UTC+7
    const today = vnTime.toISOString().slice(0, 10); // YYYY-MM-DD

    const key = `${isp.replace(/\./g, "_").replace(/\s+/g, "_")}_${today}`;
    const dbUrl = `https://thuong-66f3b-default-rtdb.asia-southeast1.firebasedatabase.app/limits/${key}.json`;

    // Get existing data
    const getRes = await fetch(dbUrl);
    let data = await getRes.json();
    let count = data?.count || 0;

    if (count >= 5) {
      return new Response(JSON.stringify({ success: false, error: "Quota exceeded", isp, count }), {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Remaining": "0",
          "X-Client-ISP": isp
        }
      });
    }

    // Update count in Realtime DB
    const updated = {
      isp,
      count: count + 1
    };

    await fetch(dbUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated)
    });

    return new Response(JSON.stringify({
      success: true,
      message: "Request allowed and logged to Realtime DB",
      isp,
      count: count + 1
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-RateLimit-Remaining": (5 - count - 1).toString(),
        "X-Client-ISP": isp
      }
    });
  }
}
