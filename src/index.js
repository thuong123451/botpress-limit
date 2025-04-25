export default {
  async fetch(request, env, ctx) {
    const ip = new URL(request.url).searchParams.get("ip") || request.headers.get("cf-connecting-ip") || "unknown";

    const now = new Date();
    if (now.getHours() < 8) now.setDate(now.getDate() - 1);
    const today = now.toISOString().slice(0, 10);
    const docId = `${ip}_${today}`;
    const docPath = `ip-limits/${docId}`;

    const serviceAccount = {
      "type": "service_account",
      "project_id": "thuong-66f3b",
     "private_key_id": "f344e2691849a1c40406f25ebf5f5c70be0f79fd", // ✅ Đã thay
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
      "client_email": "firebase-adminsdk-fbsvc@thuong-66f3b.iam.gserviceaccount.com",
      "client_id": "106897292427396741970",
      "auth_uri": "https://accounts.google.com/o/oauth2/auth",
      "token_uri": "https://oauth2.googleapis.com/token",
      "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
      "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40thuong-66f3b.iam.gserviceaccount.com"
    };

    const access_token = await getAccessToken(serviceAccount);

    let count = 0;
    let docExists = false;
    const getRes = await fetch(`https://firestore.googleapis.com/v1/projects/${serviceAccount.project_id}/databases/(default)/documents/${docPath}`, {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    if (getRes.ok) {
      const data = await getRes.json();
      count = parseInt(data.fields?.count?.integerValue || "0");
      docExists = true;
    }

    if (count >= 5) {
      return new Response("Quota exceeded", { status: 403 });
    }

    if (docExists) {
      // Update count
      await fetch(`https://firestore.googleapis.com/v1/projects/${serviceAccount.project_id}/databases/(default)/documents/${docPath}?updateMask.fieldPaths=count`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fields: {
            count: { integerValue: (count + 1).toString() }
          }
        })
      });
    } else {
      // Create new document
      await fetch(`https://firestore.googleapis.com/v1/projects/${serviceAccount.project_id}/databases/(default)/documents/ip-limits?documentId=${docId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fields: {
            count: { integerValue: "1" }
          }
        })
      });
    }

    return new Response("Allowed", { status: 200 });
  }
};

async function getAccessToken(sa) {
  const iat = Math.floor(Date.now() / 1000);
  const payload = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/datastore",
    aud: sa.token_uri,
    exp: iat + 3600,
    iat
  };
  const header = {
    alg: "RS256",
    typ: "JWT"
  };
  const encoder = new TextEncoder();
  const jwtData = `${btoa(JSON.stringify(header))}.${btoa(JSON.stringify(payload))}`;
  const keyData = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(sa.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", keyData, encoder.encode(jwtData));
  return fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${jwtData}.${btoa(String.fromCharCode(...new Uint8Array(sig)))}`
    })
  }).then(res => res.json()).then(data => data.access_token);
}

function pemToArrayBuffer(pem) {
  const b64 = pem.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}
