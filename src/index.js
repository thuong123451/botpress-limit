// index.js
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const firebaseConfig = JSON.parse(FIREBASE_SERVICE_JSON)
const app = initializeApp({ credential: cert(firebaseConfig) })
const db = getFirestore(app)

const DAILY_LIMIT = 5
const BLOCKED_ISPS = ['VNPT', 'Viettel', 'FPT'] // Tuỳ chỉnh
const TIMEZONE_OFFSET = 7 * 60 * 60 * 1000 // UTC+7

function getTodayKey(ip) {
  const now = new Date(Date.now() + TIMEZONE_OFFSET)
  const y = now.getUTCFullYear()
  const m = String(now.getUTCMonth() + 1).padStart(2, '0')
  const d = String(now.getUTCDate()).padStart(2, '0')
  return `${ip}_${y}-${m}-${d}`
}

export default {
  async fetch(request, env, ctx) {
    const ip = request.headers.get('cf-connecting-ip') || 'unknown'
    const isp = request.headers.get('cf-isp') || 'unknown'

    if (BLOCKED_ISPS.some(bad => isp.includes(bad))) {
      return new Response('Blocked ISP', { status: 403 })
    }

    const key = getTodayKey(ip)
    const doc = db.collection('ip_limits').doc(key)
    const snap = await doc.get()
    const count = snap.exists ? snap.data().count : 0

    if (count >= DAILY_LIMIT) {
      return new Response('Rate limit exceeded', { status: 429 })
    }

    await doc.set({ count: count + 1 }, { merge: true })

    // Gọi tiếp xử lý Botpress hoặc API khác ở đây
    return new Response('OK')
  }
}
