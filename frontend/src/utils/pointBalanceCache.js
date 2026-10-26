import AsyncStorage from '@react-native-async-storage/async-storage'

export const getKnownPointsCacheKey = (userId) => `lastKnownPoints:${userId}`

export const cacheKnownPoints = async (userId, points) => {
  const balance = Number(points)
  if (!userId || !Number.isSafeInteger(balance)) {
    throw new Error('A valid user ID and point balance are required to update the points cache.')
  }

  await AsyncStorage.setItem(getKnownPointsCacheKey(userId), String(balance))
}
