import { Alert, Platform } from 'react-native'

const showAlert = (title, message) => {
  if (Platform.OS === 'web') {
    window.alert([title, message].filter(Boolean).join('\n\n'))
    return
  }

  Alert.alert(title, message)
}

export default showAlert
