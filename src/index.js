import { getFirestore } from './firebase.js'

const BLOCKED_ISPS = ['FPT Telecom', 'Viettel Group', 'VNPT'];
const BLOCKED_IPS = ['123.45.67.89'];
const DAILY_LIMIT = 5;
const TIMEZONE_OFFSET = 7 * 60 * 60 * 1000; // UTC+7 (Vietnam Time)

function getToday8AMTimestampVN() {
  const now = new Date();
  const utcNow = now.getTime();
  const vnNow = new Date(utcNow + TIMEZONE_OFFSET);
  vnNow.setUTCHours(1, 0, 0, 0); // 8AM VN = 1AM UTC
  return vnNow.getTime();
}

export default {
  async fetch(request, env, ctx) {
    const ip = request.headers.get("cf-connecting-ip") || "unknown";
    const isp = request.headers.get("cf-isp") || "unknown";
    const country = request.headers.get("cf-ipcountry") || "unknown";

    if (BLOCKED_IPS.includes(ip)) {
      return new Response("Access denied (IP blocked)", { status: 403 });
    }

    if (BLOCKED_ISPS.some(bad => isp.includes(bad))) {
      return new Response("Access denied (ISP blocked)", { status: 403 });
    }

    const db = getFirestore(env);
    const ref = db.collection('usage').doc(ip);
    const snap = await ref.get();
    const data = snap.exists ? snap.data() : {};

    const todayReset = getToday8AMTimestampVN();

    let { count = 0, lastReset = 0 } = data;

    if (lastReset < todayReset) {
      count = 0;
      lastReset = todayReset;
    }

    if (count >= DAILY_LIMIT) {
      return new Response("Rate limit exceeded (5 requests per day)", { status: 429 });
    }

    await ref.set({ count: count + 1, lastReset, isp, country }, { merge: true });

    return new Response(`OK | IP: ${ip}, ISP: ${isp}, Count: ${count + 1}/5`, {
      headers: { 'content-type': 'text/plain' }
    });
  }
}
