import { Platform } from 'react-native'

export const webTextAlignRight = Platform.select({
  web: { textAlign: 'right' },
  default: {},
})
