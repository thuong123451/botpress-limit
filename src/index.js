port { getFirestore, collection, doc, getDoc, setDoc } from 'firebase-admin/firestore'
import { initializeApp, applicationDefault } from 'firebase-admin/app'

initializeApp({
  credential: applicationDefault(),
})
const db = getFirestore()

const LIMIT = 5

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    const ip = url.searchParams.get('ip') || 'unknown'

    const now = new Date()
    const currentHour = now.getUTCHours() + 7 // Giờ VN (UTC+7)
    const resetTimestamp = new Date(now)
    if (currentHour >= 8) {
      resetTimestamp.setUTCHours(1) // 8h sáng VN = 1h UTC
      resetTimestamp.setUTCDate(now.getUTCDate() + 1)
    } else {
      resetTimestamp.setUTCHours(1)
    }
    resetTimestamp.setUTCMinutes(0, 0, 0)
    const resetTime = Math.floor(resetTimestamp.getTime() / 1000)

    const ref = doc(collection(db, 'ip_limits'), ip)
    const snapshot = await getDoc(ref)

    let allowed = true
    let remaining = LIMIT
    let lastTime = Math.floor(Date.now() / 1000)

    if (!snapshot.exists() || snapshot.data().resetAt < Math.floor(Date.now() / 1000)) {
      await setDoc(ref, {
        count: 1,
        resetAt: resetTime,
        lastTime
      })
      remaining = LIMIT - 1
    } else {
      const data = snapshot.data()
      if (data.count >= LIMIT) {
        allowed = false
        remaining = 0
      } else {
        await setDoc(ref, {
          count: data.count + 1,
          resetAt: data.resetAt,
          lastTime
        })
        remaining = LIMIT - (data.count + 1)
      }
    }

    return new Response(JSON.stringify({ allowed, remaining, lastTime }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
}
