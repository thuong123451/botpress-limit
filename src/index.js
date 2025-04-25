const FIREBASE_PROJECT_ID = '"thuong-66f3b"';
const FIREBASE_API_KEY = `-----BEGIN PRIVATE KEY-----
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
-----END PRIVATE KEY-----\n`;
const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

const DAILY_LIMIT = 5; // ⚡ Số lượt cho phép mỗi IP/ISP mỗi ngày

function getTodayDateString() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

async function handleRequest(request) {
  const { searchParams } = new URL(request.url);

  const ip = searchParams.get('ip') || request.headers.get('CF-Connecting-IP') || 'unknown';
  const cf = request.cf || {}; // Cloudflare header
  const isp = cf.asOrganization || 'Unknown-ISP';

  const today = getTodayDateString();
  const id = `${ip}_${isp.replace(/\s+/g, '_')}`; // Tạo ID: IP_ISP

  console.log(`Checking IP: ${ip}, ISP: ${isp}`);

  const docPath = `ip-limits/${encodeURIComponent(id)}`;

  try {
    // Fetch existing document
    const getRes = await fetch(`${FIRESTORE_URL}/${docPath}?key=${FIREBASE_API_KEY}`);
    let data = {};
    if (getRes.ok) {
      data = await getRes.json();
    } else {
      console.log('First time seen:', id);
    }

    const fields = data.fields || {};
    const lastVisitDate = fields.lastDate?.stringValue || '';
    let count = fields.count?.integerValue ? parseInt(fields.count.integerValue) : 0;

    if (lastVisitDate !== today) {
      count = 0;
    }

    if (count >= DAILY_LIMIT) {
      console.log(`IP+ISP ${id} exceeded limit`);
      return new Response('You have reached your daily limit.', { status: 429 });
    }

    // Update count
    const patchBody = {
      fields: {
        count: { integerValue: count + 1 },
        lastDate: { stringValue: today },
        ip: { stringValue: ip },
        isp: { stringValue: isp }
      }
    };

    const patchRes = await fetch(`${FIRESTORE_URL}/${docPath}?key=${FIREBASE_API_KEY}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patchBody)
    });

    const patchResult = await patchRes.json();
    console.log('Updated Firestore:', patchResult);

    return new Response(`Request accepted. (${count + 1}/${DAILY_LIMIT})`);
  } catch (error) {
    console.log('Error:', error.message);
    return new Response('Server error', { status: 500 });
  }
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});
