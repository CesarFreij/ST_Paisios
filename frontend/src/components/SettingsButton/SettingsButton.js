import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import styles from './styles';
import { useState } from 'react'
import { useNavigation } from '@react-navigation/native';

export default function ModalScreen() {
    const [settingsVisible, setSettingsVisible] = useState(false);
    const navigation = useNavigation();

    const openPoints = () => {
        setSettingsVisible(false);
        navigation.navigate('Points');
    };

    const openRank = () => {
        setSettingsVisible(false);
        navigation.navigate('Rank');
    };

    const openWeeklyExam = () => {
        setSettingsVisible(false);
        navigation.navigate('WeeklyExam');
    };

    return (
        <>
        {/* Settings Button */}
            <TouchableOpacity
                style={styles.settingsButton}
                onPress={() => setSettingsVisible(true)}
            >
                <FontAwesome5 name="align-justify" size={30} color="white" />
            </TouchableOpacity>
            {/* Modal Screen */}
            <Modal
                visible={settingsVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setSettingsVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setSettingsVisible(false)}
                >
                    <TouchableOpacity
                        style={styles.modalContent}
                        activeOpacity={1}
                        onPress={() => {}}
                    >
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>الإعدادات</Text>
                            <TouchableOpacity onPress={() => setSettingsVisible(false)}>
                                <FontAwesome5 name="times" size={24} color="black" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            {/* Points Option */}
                            <TouchableOpacity style={styles.menuItem} onPress={openPoints}>
                                <FontAwesome5 name="star" size={20} color="#348cb2" />
                                <Text style={styles.menuItemText}>نقاطي</Text>
                                <Text style={styles.pointsValue}>950</Text>
                            </TouchableOpacity>

                            {/* Ranking Option */}
                            <TouchableOpacity style={styles.menuItem} onPress={openRank}>
                                <FontAwesome5 name="trophy" size={20} color="#f39c12" />
                                <Text style={styles.menuItemText}>ترتيبي</Text>
                                <Text style={styles.rankValue}>#12</Text>
                            </TouchableOpacity>

                            {/* Weekly exam Option */}
                            <TouchableOpacity style={styles.menuItem} onPress={openWeeklyExam}>
                                <FontAwesome5 name="book" size={20} color="#2e86de" />
                                <Text style={styles.menuItemText}>الاختبارات الأسبوعية</Text>
                                <Text style={styles.pointsValue}>جديد</Text>
                            </TouchableOpacity>

                            {/* Achievements Option */}
                            <TouchableOpacity style={styles.menuItem} onPress={() => { setSettingsVisible(false); navigation.navigate('Achievements'); }}>
                                <FontAwesome5 name="award" size={20} color="#9b59b6" />
                                <Text style={styles.menuItemText}>الإنجازات والألقاب</Text>
                                <Text style={styles.pointsValue}>جديد</Text>
                            </TouchableOpacity>

                            {/* Logout Option */}
                            <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={() => navigation.replace('LoginRegister')}>
                                <FontAwesome5 name="sign-out-alt" size={20} color="#e74c3c" />
                                <Text style={styles.logoutText}>تسجيل الخروج</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </>
    )
}
