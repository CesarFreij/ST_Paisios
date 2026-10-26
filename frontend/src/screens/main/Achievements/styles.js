import { StyleSheet } from 'react-native'

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f8ff',
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: '#f0f8ff',
  },
  headerTitle: {
    flex: 1,
    color: '#0b3d91',
    fontSize: 28,
    fontWeight: 'bold',
    direction: 'ltr'
  },
  backButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginStart: 12,
  },
  backText: {
    color: '#348cb2',
    fontSize: 16,
    marginEnd: 8,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 14,
    marginTop: 8,
  },
  sectionTitle: {
    color: '#0b3d91',
    fontSize: 21,
    fontWeight: '800',
    direction: 'ltr'
  },
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 14,
  },
  stateText: {
    color: '#63738f',
    fontSize: 16,
  },
  retryButton: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#348cb2',
  },
  retryText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  achievementCard: {
    padding: 17,
    marginBottom: 13,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2eaf2',
    backgroundColor: '#ffffff',
    shadowColor: '#16324f',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 9,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  iconBadge: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: '#eaf5fb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeading: {
    flex: 1,
    marginEnd: 12,
  },
  cardTitle: {
    color: '#0b3d91',
    fontSize: 16,
    fontWeight: '800',
    direction: 'ltr'
  },
  cardDescription: {
    marginTop: 4,
    color: '#718198',
    fontSize: 12,
    lineHeight: 18,
    direction: 'ltr'
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 14,
    marginBottom: 12,
    marginStart: 2,
    width: '100%',
  },
  levelText: {
    marginEnd: 6,
    color: '#687991',
    fontSize: 12,
  },
  countRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 7,
  },
  countText: {
    color: '#304968',
    fontSize: 13,
    fontWeight: '700',
  },
  nextTierText: {
    color: '#75859a',
    fontSize: 12,
  },
  achievementTrack: {
    width: '100%',
    height: 8,
    overflow: 'hidden',
    borderRadius: 6,
    backgroundColor: '#e7edf4',
  },
  achievementFill: {
    height: '100%',
    borderRadius: 6,
    backgroundColor: '#348cb2',
  },
  pathCard: {
    padding: 18,
    marginBottom: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#e2eaf2',
    backgroundColor: '#ffffff',
    shadowColor: '#16324f',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
  },
  pathSummary: {
    alignItems: 'center',
    marginBottom: 14,
  },
  pointsTotal: {
    color: '#0b3d91',
    fontSize: 19,
    fontWeight: '900',
    direction: 'ltr'
  },
  currentTitle: {
    marginTop: 5,
    color: '#2e7d32',
    fontSize: 15,
    fontWeight: '800',
  },
  pathTrack: {
    position: 'relative',
    paddingVertical: 3,
  },
  milestoneItem: {
    position: 'relative',
    minHeight: 56,
  },
  milestoneConnector: {
    position: 'absolute',
    top: 28,
    right: 14,
    width: 4,
    height: 56,
    borderRadius: 3,
    backgroundColor: '#d9dfe6',
  },
  milestoneConnectorFill: {
    width: '100%',
    borderRadius: 3,
    backgroundColor: '#2e7d32',
  },
  milestoneRow: {
    minHeight: 56,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    zIndex: 1,
  },
  milestoneDot: {
    zIndex: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  milestoneUnlocked: {
    borderColor: '#2e7d32',
    backgroundColor: '#2e7d32',
  },
  milestoneLocked: {
    borderColor: '#c6ced8',
  },
  milestoneNumber: {
    color: '#8b96a5',
    fontSize: 12,
    fontWeight: '800',
  },
  milestoneInfo: {
    flex: 1,
    marginHorizontal: 13,
  },
  milestoneName: {
    color: '#788596',
    fontSize: 15,
    fontWeight: '700',
  },
  milestoneNameUnlocked: {
    color: '#2e7d32',
  },
  milestonePoints: {
    marginTop: 3,
    color: '#929dab',
    fontSize: 12,
  },
  milestoneStatus: {
    minWidth: 48,
    color: '#939eab',
    fontSize: 11,
    fontWeight: '700',
  },
  pathHint: {
    marginTop: 13,
    color: '#63738f',
    fontSize: 13,
    lineHeight: 20,
    alignSelf: 'center'
  },
})

export default styles
