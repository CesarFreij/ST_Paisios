import { useState } from 'react'
import { View, Text, Modal, TouchableOpacity } from 'react-native'
import styles from './styles'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';

const buttons = [
    { id: 'pray', name: 'pray', label: 'الصلاة', points: 5, icon: FontAwesome5 },
    { id: 'bible', name: 'bible', label: 'الكتاب المقدس', points: 10, icon: FontAwesome5 },
    { id: 'church', name: 'church', label: 'الكنيسة', points: 8, icon: FontAwesome5 },
    { id: 'user-group', name: 'user-group', label: 'عمل الخير', points: 7, icon: FontAwesome6 },
];

const ButtonIcon = ({ name, size = 30, icon: Icon = FontAwesome5, onPress }) => (
    <TouchableOpacity style={styles.button} onPress={onPress} activeOpacity={0.8}>
        <Icon name={name} size={size} color="white" />
    </TouchableOpacity>
);

const HamburgerBanButton = ({ onPress }) => (
    <TouchableOpacity style={styles.button} onPress={onPress} activeOpacity={0.8}>
        <View style={styles.iconWrapper}>
            <FontAwesome5 name="hamburger" size={15} color="white" />
            <FontAwesome5 name="ban" size={30} color="white" style={styles.banIcon} />
        </View>
    </TouchableOpacity>
);

export default function CustomButton() {
    const [confirmVisible, setConfirmVisible] = useState(false);
    const [selectedTodo, setSelectedTodo] = useState('');
    const [selectedPoints, setSelectedPoints] = useState(0);

    const openConfirm = (label, points) => {
        setSelectedTodo(label);
        setSelectedPoints(points);
        setConfirmVisible(true);
    };

    const handleAddPoints = () => {
        setConfirmVisible(false);
        // هنا يمكنك إضافة منطق إضافة النقاط أو الاتصال بالدالة المناسبة
        console.log(`إضافة ${selectedPoints} نقاط لـ ${selectedTodo}`);
    };

    return (
        <>
            <View style={styles.container}>
                <ButtonIcon
                    name="pray"
                    size={30}
                    onPress={() => openConfirm('الصلاة', 5)}
                />
                <HamburgerBanButton
                    onPress={() => openConfirm('الصوم', 0)}
                />
                <ButtonIcon
                    name="bible"
                    size={30}
                    onPress={() => openConfirm('الكتاب المقدس', 10)}
                />
                <ButtonIcon
                    name="church"
                    size={30}
                    onPress={() => openConfirm('الكنيسة', 8)}
                />
                <ButtonIcon
                    name="user-group"
                    size={27}
                    icon={FontAwesome6}
                    onPress={() => openConfirm('عمل الخير', 7)}
                />
            </View>

            <Modal
                visible={confirmVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setConfirmVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPressOut={() => setConfirmVisible(false)}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{`هل أنت متأكد من الضغط على زر ${selectedTodo}؟`}</Text>
                        <Text style={styles.modalMessage}>
                            سيتم إضافة <Text style={styles.modalMessageBold}>{selectedPoints}</Text>
                            {'$ '}إلى رصيدك!
                        </Text>
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setConfirmVisible(false)}
                            >
                                <Text style={styles.modalButtonText}>إلغاء</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.confirmButton]}
                                onPress={handleAddPoints}
                            >
                                <Text style={styles.modalButtonText}>إضافة</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
        </>
    )
}