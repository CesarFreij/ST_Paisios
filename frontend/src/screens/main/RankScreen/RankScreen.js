import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useNavigation } from '@react-navigation/native';
import styles from './styles';

const friends = [
    { id: '1', name: 'أحمد محمد', points: 1200, rank: 1 },
    { id: '2', name: 'فاطمة علي', points: 1150, rank: 2 },
    { id: '3', name: 'محمد حسن', points: 1100, rank: 3 },
    { id: '4', name: 'سارة خالد', points: 1050, rank: 4 },
    { id: '5', name: 'علي أحمد', points: 1000, rank: 5 },
    { id: '6', name: 'لينا سامي', points: 980, rank: 6 },
    { id: '7', name: 'كريم يوسف', points: 960, rank: 7 },
    { id: '8', name: 'نورا جميل', points: 940, rank: 8 },
    { id: '9', name: 'حسن علي', points: 920, rank: 9 },
    { id: '10', name: 'مريم خالد', points: 900, rank: 10 },
    { id: '11', name: 'يوسف أحمد', points: 880, rank: 11 },
    { id: '12', name: 'سيزار فريج', points: 950, rank: 12, isCurrentUser: true },
    { id: '13', name: 'جورج بطرس', points: 850, rank: 13 },
    { id: '14', name: 'ماريا يوسف', points: 830, rank: 14 },
    { id: '15', name: 'بولس أنطون', points: 810, rank: 15 },
];

export default function RankScreen() {
    const navigation = useNavigation();
    const currentUser = friends.find(friend => friend.isCurrentUser);

    const getRankIcon = (rank) => {
        if (rank === 1) return 'trophy';
        if (rank === 2) return 'medal';
        if (rank === 3) return 'award';
        return 'star';
    };

    const getRankColor = (rank) => {
        if (rank === 1) return '#FFD700';
        if (rank === 2) return '#C0C0C0';
        if (rank === 3) return '#CD7F32';
        return '#348cb2';
    };

    const renderItem = ({ item }) => (
        <View style={[styles.rankCard, item.isCurrentUser && styles.currentUserCard]}>
        <View style={styles.rankInfo}>
            <View style={[styles.rankBadge, { backgroundColor: getRankColor(item.rank) }]}>
            <FontAwesome5 name={getRankIcon(item.rank)} size={16} color="white" />
            <Text style={styles.rankNumber}>#{item.rank}</Text>
            </View>
            <View style={styles.userInfo}>
            <Text style={[styles.userName, item.isCurrentUser && styles.currentUserName]}>{item.name}</Text>
            {item.isCurrentUser && <Text style={styles.currentUserLabel}>(أنت)</Text>}
            </View>
        </View>
        <View style={styles.pointsContainer}>
            <Text style={styles.pointsText}>{item.points} نقطة</Text>
        </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <FontAwesome5 name="chevron-left" size={20} color="#348cb2" />
                <Text style={styles.backText}>رجوع</Text>
                </TouchableOpacity>
                <Text style={styles.title}>ترتيبي</Text>
            </View>

            <View style={styles.currentRankCard}>
                <Text style={styles.currentRankLabel}>ترتيبك الحالي</Text>
                <View style={styles.currentRankInfo}>
                <View style={[styles.rankBadge, { backgroundColor: getRankColor(currentUser.rank) }]}>
                    <FontAwesome5 name={getRankIcon(currentUser.rank)} size={20} color="white" />
                    <Text style={styles.currentRankNumber}>#{currentUser.rank}</Text>
                </View>
                <View style={styles.currentUserDetails}>
                    <Text style={styles.currentUserName}>{currentUser.name}</Text>
                    <Text style={styles.currentUserPoints}>{currentUser.points} نقطة</Text>
                </View>
                </View>
            </View>

            <Text style={styles.sectionTitle}>ترتيب الأصدقاء</Text>

            <FlatList
                data={friends}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                renderItem={renderItem}
            />
        </SafeAreaView>
    );
}
