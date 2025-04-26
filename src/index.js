export default {
  async fetch(request, env, ctx) {
    const isp = request.cf?.asOrganization || "unknown-isp";

    const now = new Date();
    const vnTime = new Date(now.getTime() + 7 * 60 * 60 * 1000); // UTC+7
    const today = vnTime.toISOString().slice(0, 10);
    const docKey = `${isp}_${today}`;
    const dbUrl = `https://thuong-66f3b-default-rtdb.asia-southeast1.firebasedatabase.app/limits/${encodeURIComponent(docKey)}.json`;

    // Lấy dữ liệu hiện tại
    let count = 0;
    try {
      const getRes = await fetch(dbUrl);
      if (getRes.ok) {
        const data = await getRes.json();
        count = data?.count || 0;
      }
    } catch (e) {
      // nếu lỗi, coi như lần đầu
      count = 0;
    }

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

    // Ghi log count mới
    await fetch(dbUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isp, count: count + 1 })
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
};
