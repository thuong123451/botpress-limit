mport { getFirestore, collection, doc, getDoc, setDoc } from 'firebase-admin/firestore'
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
      resetTimestamp.setUTCMinutes(0)
      resetTimestamp.setUTCSeconds(0)
      resetTimestamp.setUTCMilliseconds(0)
    } else {
      resetTimestamp.setUTCDate(resetTimestamp.getUTCDate() - 1)
      resetTimestamp.setUTCHours(1)
      resetTimestamp.setUTCMinutes(0)
      resetTimestamp.setUTCSeconds(0)
      resetTimestamp.setUTCMilliseconds(0)
    }

    const userRef = doc(db, 'usage', ip)
    const userSnap = await getDoc(userRef)

    let remaining = LIMIT
    if (userSnap.exists()) {
      const data = userSnap.data()
      if (data.resetTimestamp.toMillis() > resetTimestamp.getTime()) {
        remaining = data.remaining
      }
    }

    if (remaining > 0) {
      await setDoc(userRef, {
        remaining: remaining - 1,
        resetTimestamp: resetTimestamp,
      })
      return new Response(JSON.stringify({ allowed: true, remaining: remaining - 1 }), {
        headers: { 'Content-Type': 'application/json' },
      })
    } else {
      return new Response(JSON.stringify({ allowed: false, remaining: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }
  },
}
