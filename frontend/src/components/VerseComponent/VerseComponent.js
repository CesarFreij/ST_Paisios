import { View, Text } from 'react-native'
import styles from './styles'

export default function VerseComponent() {
    return (
        <View style={styles.container}>
            <Text style={styles.verseText}>"احمل صليبك كل يوم واتبعني ماذا ينتفع العالم لو ربح العالم كله وخسر نفسه؟"</Text>
        </View>
    )
}