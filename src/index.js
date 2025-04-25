import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { Buffer } from 'buffer';

const serviceAccount = {
  "type": "service_account",
  "project_id": "thuong-66f3b",
  "private_key_id": "695c04c2d6b638b77e0dcd136f9b532e00497ef7",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCrlOH8pNc2wXkx\nZlSlGZCS4hazpbBPrXmpQN4AqPqu1jtH4ok+KcfXxAxW4UjU0GuxBz5NLk644VlX\nXXVdRDkqk3+QMcRF0HuGqR9fpOmkn6xmULJdVe5LWi4/j1iy9xoCA6Sd53OTHExM\nWCeXCVAdceodllZhx/dJvBrmeQ3aP0781C5TXCxhVgXCFfKg7uE8DOgHaLluk5F0\nU6pfeEekoCKfIkFU1BOEnmXnXnnRAU9SfnKAmhYQNlKUiQkj8ZynoSxFEaoOti5w\nTxYZELjzGNm/W4BSzZyEhDxQOwoFxoBafy3nMTyGVjjgJa998QMOihCqG3xlfKWq\n6Bdr/apfAgMBAAECggEAS7oTfVpRY+jC8OMNk6pzTOh9BX+oj5nsOp+W+6qYrSZ/\nFmxsjyOIgHmVyph2ePqdtQ2R2SWJd/55XF4yqN2t71UW9VCJpBhuFFI7Nw7FUbNp\nNuUBu8DrwZUFGWdOSfpWH7J06n4W28QfBojXvEjPc5dtsO5DpLdJNGFRbAvcachS\nmpwKCUzqHyZJSyYhEVzclzpYw2CK60K/9rT3dzpFofhwwMXV0HB1ZA0LDKEUF5NR\nSrf3BQQzstW9F3EgTZYMjVDBAAgYmkwe68RPY6+iLuHoz3C78joaMsCdPl4rZlhH\nGYcwca6wW0lvOXyrMhMddl3Yr0WdtCNmivv5D3rqjQKBgQDjXYGwMrsh9LUoDnoM\nLLV8Ci4ivZ2njMENe1JlWgU0/k786Cu8HfOn13YaYhMErQLXJOEVp8JFAwFMI19i\n4+GZ7yij3Un0ajcmEnBAZoaXjvJ8eyhpHKpIXqO1pnmO1mOqMeBQFc6Bjxx8CyQj\nhACgD5Bb12n0ej0V6ziGfn4Y/QKBgQDBMNoS/NMEOC9O/FyhK93TvQU0X/vFsXcm\nA8kfxrAGINlOzmhSK5yfM0NAzRFbDVCpd44UeKA6dBHXE4jOBekp+7FtIlLu463L\nBQDwc/F8HCmWsw/pEa6MvFkmuhTftd2JqPTgi4fpVrwJVmu+bVt4WkxCl2H8cs/8\nBiHamKpNiwKBgFaMOpjKxucnEmp8EENgJXlhGqzIxyGHd9lc70F7Ye4JPCITcsp6\nEEz8vI1QdfLatPEWrcOjh1TjzvOfp2iqXC9PlYXC76rlX7bTX/1zyZoZpP5zly9j\n5QIFXIYCJ9WSkH+x2rRBiMlSo8IoL4qBbgd/xTDgsAmLGoOkdXDk57U1AoGATdQC\nZpfX4uFHnchpAL0NVpnVmO36HgCKgZQQ2G5Qx4dARFE/EatkI3ahZ1+12Dqa/kqd\nwH1//0x3S3AhMu6KqlEtf0vOoVKz1xAi+rua02b9Eir9A+YNrcDLIaDhe+ZmY2jf\njf5oOIaqphBcw5CGwwuNoV4fKXaPd3Z4+Pl70lUCgYEAxORLUnBKuRGkNFHH84fX\nQ5jbTVyQzTAbhIXNFlEn6FtrnI81n2NrXh0ICSd/Y02ZlcW/QFYOdKU3scM7xJHg\nyFDvpoL9uEFHyxyyMci8m684wrcasOixneloc+SaRpIxjtZl8fqITMfP+5p3W2Ad\no3EIleaKCEbXfvWhpKh6zRo=\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@thuong-66f3b.iam.gserviceaccount.com",
  "client_id": "106897292427396741970",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40thuong-66f3b.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();
const LIMIT_PER_DAY = 5;
const RESET_HOUR_VN = 8;

const getTodayKey = () => {
  const now = new Date();
  const vnOffset = -7; // UTC+7 → offset = -7 từ UTC
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
