import { useCallback, useState } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import api from '../../api/apiClient'
import styles from './styles'

export default function VerseComponent() {
    const [verse, setVerse] = useState(null)
    const [error, setError] = useState(false)

    const loadVerse = useCallback(async () => {
        try {
            const response = await api.get('/api/verses/today')
            const dailyVerse = response.data?.data
            if (typeof dailyVerse?.text !== 'string' || typeof dailyVerse?.reference !== 'string') {
                throw new Error('The daily verse response is invalid.')
            }
            setVerse(dailyVerse)
            setError(false)
        } catch (requestError) {
            console.error('Failed to load the daily verse:', requestError)
            setError(true)
        }
    }, [])

    useFocusEffect(
        useCallback(() => {
            loadVerse()
            return undefined
        }, [loadVerse]),
    )

    return (
        <View style={styles.container}>
            {verse ? (
                <Text style={styles.verseText}>
                    {verse.text} ({verse.reference})
                </Text>
            ) : (
                <View style={styles.loadingContainer}>
                    <Text style={styles.verseText}>
                        {error ? 'تعذر تحميل آية اليوم.' : 'جارٍ تحميل آية اليوم...'}
                    </Text>
                    {error && (
                        <TouchableOpacity onPress={loadVerse} accessibilityRole="button">
                            <Text style={styles.retryText}>إعادة المحاولة</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </View>
    )
}