import { getFirestore, collection, doc, getDoc, setDoc } from 'firebase-admin/firestore'
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
    } else {
      resetTimestamp.setUTCHours(-23) // Trước 8h sáng -> lùi về hôm trước
    }
    resetTimestamp.setUTCMinutes(0)
    resetTimestamp.setUTCSeconds(0)
    resetTimestamp.setUTCMilliseconds(0)

    const todayKey = resetTimestamp.toISOString().split('T')[0]

    const userRef = doc(collection(db, 'limits'), ip)
    const userDoc = await getDoc(userRef)

    let data = {}
    if (userDoc.exists()) {
      data = userDoc.data() || {}
    }

    if (!data.todayKey || data.todayKey !== todayKey) {
      data.todayKey = todayKey
      data.count = 0
    }

    if (data.count >= LIMIT) {
      return new Response(JSON.stringify({ allowed: false }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    data.count += 1
    await setDoc(userRef, data)

    return new Response(JSON.stringify({ allowed: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
