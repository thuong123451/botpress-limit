import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { Buffer } from 'buffer';

const serviceAccount = {
  "type": "service_account",
  "project_id": "thuong-66f3b",
  "private_key_id": "695c04c2d6b638b77e0dcd136f9b532e00497ef7",
  "private_key": `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCrlOH8pNc2wXkx
... (rút gọn vì dài, bạn đã có)
-----END PRIVATE KEY-----\n`,
  "client_email": "firebase-adminsdk-fbsvc@thuong-66f3b.iam.gserviceaccount.com",
  "client_id": "106897292427396741970",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40thuong-66f3b.iam.gserviceaccount.com"
};

const app = initializeApp({
  credential: cert(serviceAccount)
});
const db = getFirestore(app);

const MAX_REQUESTS_PER_DAY = 5;
const RESET_HOUR_VN = 8; // 8AM Vietnam (UTC+7)

function getTodayKeyVN() {
  const now = new Date();
  const utc7 = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  const year = utc7.getFullYear();
  const month = utc7.getMonth() + 1;
  const date = utc7.getDate();
  return `${year}-${month}-${date}`;
}

export default {
  async fetch(request, env, ctx) {
    const ip = request.headers.get("cf-connecting-ip") || "unknown";
    const isp = request.headers.get("cf-isp") || "";
    const blockedISPs = ["VNPT", "Viettel", "FPT"];

    if (blockedISPs.some(name => isp.includes(name))) {
      return new Response("Blocked ISP", { status: 403 });
    }

    const dayKey = getTodayKeyVN();
    const docRef = db.collection('ip_limits').doc(`${ip}_${dayKey}`);
    const docSnap = await docRef.get();
    let count = 0;

    if (docSnap.exists) {
      const data = docSnap.data();
      count = data.count || 0;
    }

    if (count >= MAX_REQUESTS_PER_DAY) {
      return new Response("Daily request limit exceeded", { status: 429 });
    }

    await docRef.set({ count: count + 1, updated: Date.now() }, { merge: true });

    return new Response(`Hello! IP: ${ip}, ISP: ${isp}, Request #${count + 1}`);
  }
};
