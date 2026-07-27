import { TouchableOpacity, View } from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import styles from './styles';

export default function ConnectionButton({ onPress, status }) {
    const iconName = status?.icon || 'wifi';
    const iconColor = status?.iconColor || '#ffffff';

    return (
        <TouchableOpacity style={styles.connectionButton} activeOpacity={0.8} onPress={onPress}>
            <FontAwesome5 name={iconName} size={30} color={iconColor} />
        </TouchableOpacity>
    );
}
