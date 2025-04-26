export default {
  async fetch(request, env, ctx) {
    const isp = request.cf?.asOrganization || "unknown-isp";
    const now = new Date(Date.now() + 7 * 60 * 60 * 1000); // UTC+7
    const today = now.toISOString().slice(0, 10); // yyyy-mm-dd
    const key = `${isp.replace(/\s+/g, "_")}_${today}`;
    const dbBaseURL = "https://thuong-66f3b-default-rtdb.asia-southeast1.firebasedatabase.app";
    const dbURL = `${dbBaseURL}/isp-limits/${encodeURIComponent(key)}.json`;

    // Get existing count
    const res = await fetch(dbURL);
    const data = await res.json();
    let count = data?.count || 0;

    if (count >= 5) {
      return new Response(JSON.stringify({
        success: false,
        message: "Quota exceeded",
        isp,
        count
      }), {
        status: 429,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Update new count
    count++;
    await fetch(dbURL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count, lastTime: Date.now() })
    });

    return new Response(JSON.stringify({
      success: true,
      message: "Request allowed and logged to Realtime DB",
      isp,
      count
    }), {
      headers: { "Content-Type": "application/json" }
    });
  }
}
