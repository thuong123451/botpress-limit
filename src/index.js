const FIREBASE_URL = 'https://firestore.googleapis.com/v1/projects/YOUR_PROJECT_ID/databases/(default)/documents'
const LIMIT = 5

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    const ip = url.searchParams.get('ip') || 'unknown'

    const now = new Date()
    const currentHour = now.getUTCHours() + 7 // Giờ VN (UTC+7)
    const resetTimestamp = new Date(now)

    if (currentHour >= 8) {
      resetTimestamp.setUTCHours(1)
    } else {
      resetTimestamp.setUTCHours(-23)
    }

    resetTimestamp.setUTCMinutes(0)
    resetTimestamp.setUTCSeconds(0)
    resetTimestamp.setUTCMilliseconds(0)

    const todayKey = resetTimestamp.toISOString().split('T')[0]
    const docPath = `limits/${ip}`

    const getRes = await fetch(`${FIREBASE_URL}/${docPath}`, {
      headers: {
        Authorization: `Bearer ${env.FIREBASE_TOKEN}`,
      },
    })

    let data = {
      fields: {
        count: { integerValue: '0' },
        todayKey: { stringValue: todayKey },
      },
    }

    if (getRes.ok) {
      const json = await getRes.json()
      const storedKey = json.fields?.todayKey?.stringValue || ''
      const count = parseInt(json.fields?.count?.integerValue || '0', 10)

      if (storedKey === todayKey) {
        if (count >= LIMIT) {
          return new Response(JSON.stringify({ allowed: false }), {
            headers: { 'Content-Type': 'application/json' },
          })
        }

        data.fields.count.integerValue = `${count + 1}`
      }
    }

    // Update document in Firestore
    await fetch(`${FIREBASE_URL}/${docPath}?updateMask.fieldPaths=count&updateMask.fieldPaths=todayKey`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.FIREBASE_TOKEN}`,
      },
      body: JSON.stringify(data),
    })

    return new Response(JSON.stringify({ allowed: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  },
}
