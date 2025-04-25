// index.js
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { Buffer } from 'buffer';

// Giải mã FIREBASE_KEY_BASE64 từ env
const serviceAccount = JSON.parse(
  Buffer.from(FIREBASE_KEY_BASE64, "base64").toString("utf-8")
);

// Khởi tạo Firebase
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();
const LIMIT_PER_DAY = 5;
const RESET_HOUR_VN = 8;

const getTodayKey = () => {
  const now = new Date();
  const vnOffset = -7; // UTC+7
  now.setUTCHours(now.getUTCHours() + vnOffset);

  if (now.getHours() < RESET_HOUR_VN) {
    now.setDate(now.getDate() - 1);
  }

  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
};

export default {
  async fetch(request, env, ctx) {
    const ip = request.headers.get("cf-connecting-ip") || "unknown";
    const isp = request.headers.get("cf-isp") || "unknown";
    const key = `${getTodayKey()}_${ip}`;

    const ref = db.collection('ip_usage').doc(key);
    const doc = await ref.get();

    let count = 0;
    if (doc.exists) {
      count = doc.data().count;
    }

    if (count >= LIMIT_PER_DAY) {
      return new Response("Bạn đã vượt quá số lượt truy cập trong ngày.", {
        status: 429
      });
    }

    await ref.set({
      count: count + 1,
      updatedAt: new Date().toISOString(),
      ip,
      isp
    });

    return new Response("Truy cập thành công", { status: 200 });
  }
};
