export default {
  async fetch(request, env, ctx) {
    const isp = request.cf?.asOrganization || "unknown-isp";
    const now = new Date();
    const vnTime = new Date(now.getTime() + 7 * 60 * 60 * 1000); // UTC+7
    const today = vnTime.toISOString().slice(0, 10);
    const key = `${isp}_${today}`;

    const baseURL = "https://thuong-66f3b-default-rtdb.asia-southeast1.firebasedatabase.app";
    const getUrl = `${baseURL}/limits/${encodeURIComponent(key)}.json`;

    // Lấy dữ liệu hiện tại
    let count = 0;
    const res = await fetch(getUrl);
    if (res.ok) {
      const data = await res.json();
      count = data?.count || 0;
    }

    if (count >= 5) {
      return new Response(JSON.stringify({
        success: false,
        error: "Quota exceeded",
        isp,
        count
      }), {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Remaining": "0",
          "X-Client-ISP": isp
        }
      });
    }

    // Cập nhật count lên Firebase
    await fetch(getUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isp, count: count + 1 })
    });

    return new Response(JSON.stringify({
      success: true,
      message: "Request allowed and logged to Firebase Realtime DB",
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
