import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f8ff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    color: '#348cb2',
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0b3d91',
  },
  descriptionCard: {
    marginHorizontal: 20,
    marginTop: 10,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#4f6272',
  },
  examCard: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  examLabel: {
    fontSize: 16,
    color: '#6f7f96',
    marginBottom: 8,
  },
  examTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1d4f91',
    marginBottom: 18,
  },
  examStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  examStatItem: {
    flex: 1,
    marginRight: 10,
  },
  statLabel: {
    fontSize: 14,
    color: '#6f7f96',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#348cb2',
  },
  startButton: {
    backgroundColor: '#348cb2',
    borderRadius: 16,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButtonDisabled: {
    backgroundColor: '#c1d7e8',
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  disabledCard: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8e9ea7',
    marginBottom: 18,
    textAlign: 'center',
  },
});

export default styles;
