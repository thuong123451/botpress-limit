import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

let firebaseApp
let db

export default {
  async fetch(request, env, ctx) {
    if (!firebaseApp) {
      const serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT)
      firebaseApp = initializeApp({
        credential: cert(serviceAccount)
      })
      db = getFirestore()
    }

    const url = new URL(request.url)
    const userId = url.searchParams.get('userId') || 'unknown'

    const usageRef = db.collection('usage_limits').doc(userId)
    const usageSnap = await usageRef.get()

    let count = 0
    if (usageSnap.exists) {
      count = usageSnap.data().count || 0
    }

    if (count >= 5) {
      return new Response('Hết lượt sử dụng!', { status: 403 })
    }

    await usageRef.set({ count: count + 1 }, { merge: true })

    return new Response(`Lượt sử dụng hiện tại: ${count + 1}`)
  }
}
