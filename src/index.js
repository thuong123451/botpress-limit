export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const isp = request.cf?.asOrganization || "unknown-isp";

    const now = new Date();
    const vnNow = new Date(now.getTime() + 7 * 60 * 60 * 1000); // UTC+7
    const today = vnNow.toISOString().slice(0, 10); // yyyy-mm-dd

    const key = `${isp}_${today}`.replace(/\./g, "-"); // Firebase không cho dấu chấm
    const dbUrl = `https://thuong-66f3b-default-rtdb.asia-southeast1.firebasedatabase.app/isp-limits/${key}.json`;

    const token = await getAccessToken(); // Tạo từ Service Account

    // Lấy dữ liệu hiện tại
    const res = await fetch(`${dbUrl}?auth=${token}`);
    const data = await res.json();
    const count = data?.count || 0;

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

    // Ghi lại dữ liệu mới
    await fetch(`${dbUrl}?auth=${token}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        count: count + 1,
        lastTime: Date.now()
      })
    });

    return new Response(JSON.stringify({
      success: true,
      message: "Request allowed",
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

// 🛡️ Hàm tạo access_token từ Firebase Service Account
async function getAccessToken() {
  const serviceAccount = {
    "type": "service_account",
    "project_id": "thuong-66f3b",
    "private_key_id": "xxx",
    "private_key": `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCrlOH8pNc2wXkx
ZlSlGZCS4hazpbBPrXmpQN4AqPqu1jtH4ok+KcfXxAxW4UjU0GuxBz5NLk644VlX
XXVdRDkqk3+QMcRF0HuGqR9fpOmkn6xmULJdVe5LWi4/j1iy9xoCA6Sd53OTHExM
WCeXCVAdceodllZhx/dJvBrmeQ3aP0781C5TXCxhVgXCFfKg7uE8DOgHaLluk5F0
U6pfeEekoCKfIkFU1BOEnmXnXnnRAU9SfnKAmhYQNlKUiQkj8ZynoSxFEaoOti5w
TxYZELjzGNm/W4BSzZyEhDxQOwoFxoBafy3nMTyGVjjgJa998QMOihCqG3xlfKWq
6Bdr/apfAgMBAAECggEAS7oTfVpRY+jC8OMNk6pzTOh9BX+oj5nsOp+W+6qYrSZ/
FmxsjyOIgHmVyph2ePqdtQ2R2SWJd/55XF4yqN2t71UW9VCJpBhuFFI7Nw7FUbNp
NuUBu8DrwZUFGWdOSfpWH7J06n4W28QfBojXvEjPc5dtsO5DpLdJNGFRbAvcachS
mpwKCUzqHyZJSyYhEVzclzpYw2CK60K/9rT3dzpFofhwwMXV0HB1ZA0LDKEUF5NR
Srf3BQQzstW9F3EgTZYMjVDBAAgYmkwe68RPY6+iLuHoz3C78joaMsCdPl4rZlhH
GYcwca6wW0lvOXyrMhMddl3Yr0WdtCNmivv5D3rqjQKBgQDjXYGwMrsh9LUoDnoM
LLV8Ci4ivZ2njMENe1JlWgU0/k786Cu8HfOn13YaYhMErQLXJOEVp8JFAwFMI19i
4+GZ7yij3Un0ajcmEnBAZoaXjvJ8eyhpHKpIXqO1pnmO1mOqMeBQFc6Bjxx8CyQj
hACgD5Bb12n0ej0V6ziGfn4Y/QKBgQDBMNoS/NMEOC9O/FyhK93TvQU0X/vFsXcm
A8kfxrAGINlOzmhSK5yfM0NAzRFbDVCpd44UeKA6dBHXE4jOBekp+7FtIlLu463L
BQDwc/F8HCmWsw/pEa6MvFkmuhTftd2JqPTgi4fpVrwJVmu+bVt4WkxCl2H8cs/8
BiHamKpNiwKBgFaMOpjKxucnEmp8EENgJXlhGqzIxyGHd9lc70F7Ye4JPCITcsp6
EEz8vI1QdfLatPEWrcOjh1TjzvOfp2iqXC9PlYXC76rlX7bTX/1zyZoZpP5zly9j
5QIFXIYCJ9WSkH+x2rRBiMlSo8IoL4qBbgd/xTDgsAmLGoOkdXDk57U1AoGATdQC
ZpfX4uFHnchpAL0NVpnVmO36HgCKgZQQ2G5Qx4dARFE/EatkI3ahZ1+12Dqa/kqd
wH1//0x3S3AhMu6KqlEtf0vOoVKz1xAi+rua02b9Eir9A+YNrcDLIaDhe+ZmY2jf
jf5oOIaqphBcw5CGwwuNoV4fKXaPd3Z4+Pl70lUCgYEAxORLUnBKuRGkNFHH84fX
Q5jbTVyQzTAbhIXNFlEn6FtrnI81n2NrXh0ICSd/Y02ZlcW/QFYOdKU3scM7xJHg
yFDvpoL9uEFHyxyyMci8m684wrcasOixneloc+SaRpIxjtZl8fqITMfP+5p3W2Ad
o3EIleaKCEbXfvWhpKh6zRo=
-----END PRIVATE KEY-----\n`,
    "client_email": "firebase-adminsdk-xxx@thuong-66f3b.iam.gserviceaccount.com",
    "client_id": "xxx",
    "token_uri": "https://oauth2.googleapis.com/token"
  };

  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 3600;

  const payload = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/firebase.database",
    aud: serviceAccount.token_uri,
    iat,
    exp
  };

  const header = { alg: "RS256", typ: "JWT" };
  const encoder = new TextEncoder();
  const jwtData = `${btoa(JSON.stringify(header))}.${btoa(JSON.stringify(payload))}`;
  const keyData = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(serviceAccount.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", keyData, encoder.encode(jwtData));
  const jwt = `${jwtData}.${btoa(String.fromCharCode(...new Uint8Array(sig)))}`;

  const res = await fetch(serviceAccount.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt
    })
  });
  const json = await res.json();
  return json.access_token;
}

function pemToArrayBuffer(pem) {
  const b64 = pem.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}
