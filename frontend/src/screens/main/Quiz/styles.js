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
    paddingTop: 8,
    paddingBottom: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    color: '#348cb2',
    fontSize: 16,
    marginStart: 8,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0b3d91',
  },
  card: {
    flex: 1,
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
  questionCounter: {
    fontSize: 16,
    color: '#6f7f96',
    marginBottom: 10,
  },
  questionText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1d4f91',
    marginBottom: 20,
    lineHeight: 32,
  },
  answerOption: {
    backgroundColor: '#f5f7fb',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  answerOptionSelected: {
    backgroundColor: '#d9eefa',
    borderWidth: 1,
    borderColor: '#348cb2',
  },
  answerText: {
    fontSize: 16,
    color: '#213a71',
  },
  answerTextSelected: {
    fontWeight: '700',
    color: '#0b3d91',
  },
  footerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 12,
  },
  navButton: {
    flex: 1,
    backgroundColor: '#348cb2',
    borderRadius: 16,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  navButtonDisabled: {
    backgroundColor: '#c1d7e8',
  },
  navButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default styles;
