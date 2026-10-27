import { Platform, StyleSheet } from 'react-native';
import { webTextAlignRight } from '../../../utils/webRtlStyles'

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    ...Platform.select({ web: { flexDirection: 'row-reverse' }, default: {} }),
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 10,
  },
  backButton: {
    flexDirection: 'row',
    ...Platform.select({ web: { flexDirection: 'row', gap: 8 }, default: {} }),
    alignItems: 'center',
  },
  backText: {
    color: '#348cb2',
    fontSize: 16,
    marginStart: 8,
    ...Platform.select({ web: { marginStart: 0 }, default: {} }),
    fontWeight: '600',
    ...webTextAlignRight,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0b3d91',
    ...webTextAlignRight,
  },
  resultCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 22,
    marginTop: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  resultLabel: {
    fontSize: 16,
    color: '#6f7f96',
    marginBottom: 8,
    ...webTextAlignRight,
  },
  resultValue: {
    fontSize: 24,
    fontWeight: '700',
    ...webTextAlignRight,
    color: '#348cb2',
  },
  messageCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 22,
    marginTop: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  messageText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1d4f91',
    lineHeight: 28,
    ...webTextAlignRight,
  },
  noteText: {
    marginTop: 18,
    fontSize: 16,
    lineHeight: 24,
    color: '#63738f',
    textAlign: 'center',
  },
  homeButton: {
    marginTop: 24,
    backgroundColor: '#348cb2',
    borderRadius: 16,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    ...webTextAlignRight,
  },
});

export default styles;
