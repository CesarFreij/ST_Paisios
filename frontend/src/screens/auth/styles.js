import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    body: {
        flex: 1,
        padding: 30,
    },
    container: {
        flex: 1,
        minHeight: '100%',
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        position: 'relative',
        overflow: 'hidden'
    },
    formBox: {
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        position: 'absolute',
    },
    form: {
        padding: 20,
    },
    formTitle: {
        fontSize: 36,
        textAlign: 'center',
    },
    inputBox: {
        marginTop: 30,
        backgroundColor: 'rgb(238, 238, 238)',
        position: 'relative',
        borderRadius: 8,
    },
    icon: {
        position: 'absolute',
        end: 20,
        top: '50%',
        transform: [{ translateY: '-50%' }],
        zIndex: 1
    },
    input: {
        color: '#000000',
        paddingVertical: 16,
        paddingStart: 20,
        paddingEnd: 50,
    },
    button: {
        backgroundColor: 'rgb(116, 148, 236)',
        borderRadius: 8,
        padding: 15,
        alignItems: 'center',
        marginTop: 30,
    },
    text: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    errorText: {
        color: '#c62828',
        textAlign: 'center',
        marginTop: 12,
        fontSize: 14,
    },
    paragraph: {
        textAlign: 'center',
        marginVertical: 20,
        lineHeight: 24,
    },
    // Toggle Section
    toggleBox: {
        position: 'absolute',
        width: '100%',
        height: '100%',
    },
    togglePanel: {
        width: '100%',
        height: '30%',
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
    },
    toggletitle: {
        color: '#fff',
        textAlign: 'center',
        fontSize: 30,
        fontWeight: 'bold',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 5,
        lineHeight: 30
    },
    toggleParagraph: {
        color: '#fff',
        textAlign: 'center',
        fontSize: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20
    },
    toggleButton: {
        borderWidth: 2,
        borderColor: '#fff',
        borderRadius: 8,
        width: 160,
        height: 46,
        justifyContent: 'center',
        alignItems: 'center',
    },
    toggleTextButton: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold'
    },
    before: {
        position: 'absolute',
        width: '100%',
        height: '300%',
        start: 0,
        backgroundColor: 'rgb(116, 148, 236)',
        borderRadius: 75,
        zIndex: 2
    },

    // Register Section


});

export default styles;