import { Platform, StyleSheet } from "react-native";
import { webTextAlignRight } from '../../utils/webRtlStyles';

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
        position: 'relative',
        overflow: 'hidden',
        ...Platform.select({
            web: {
                height: '100%',
                width: '100%',
                boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
            },
            default: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
                elevation: 5,
            },
        }),
    },
    formBox: {
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        position: 'absolute',
        zIndex: 1,
        ...Platform.select({
            web: { top: 0, left: 0, right: 0 },
            default: {},
        }),
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
        ...Platform.select({
            web: {
                paddingLeft: 50,
                paddingRight: 20,
            },
            default: {},
        }),
    },
    icon: {
        position: 'absolute',
        ...Platform.select({
            web: { left: 15 },
            default: { end: 20 },
        }),
        top: '50%',
        transform: [{ translateY: '-50%' }],
        zIndex: 1,
    },
    input: {
        color: '#000000',
        paddingVertical: 16,
        ...Platform.select({
            web: {
                width: '100%',
                outlineStyle: 'none',
                borderWidth: 0,
                textAlign: 'right',
            },
            default: {
                paddingStart: 20,
                paddingEnd: 50,
            },
        }),
        ...webTextAlignRight,
    },
    button: {
        backgroundColor: 'rgb(116, 148, 236)',
        borderRadius: 8,
        padding: 15,
        alignItems: 'center',
        marginTop: 30,
        ...Platform.select({
            web: { cursor: 'pointer' },
            default: {},
        }),
    },
    text: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        ...webTextAlignRight,
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
        ...Platform.select({
            web: { top: 0, left: 0, right: 0, bottom: 0, zIndex: 5 },
            default: {},
        }),
    },
    togglePanel: {
        width: '100%',
        height: '30%',
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
        ...Platform.select({
            web: { left: 0, right: 0 },
            default: {},
        }),
    },
    toggletitle: {
        color: '#fff',
        textAlign: 'center',
        fontSize: 30,
        fontWeight: 'bold',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 5,
        lineHeight: 30,
    },
    toggleParagraph: {
        color: '#fff',
        textAlign: 'center',
        fontSize: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    toggleButton: {
        borderWidth: 2,
        borderColor: '#fff',
        borderRadius: 8,
        width: 160,
        height: 46,
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            web: { cursor: 'pointer' },
            default: {},
        }),
    },
    interactiveIcon: {
        ...Platform.select({
            web: { zIndex: 10, cursor: 'pointer', pointerEvents: 'auto' },
            default: {},
        }),
    },
    toggleTextButton: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        ...webTextAlignRight,
    },
    before: {
        position: 'absolute',
        width: '100%',
        height: '300%',
        start: 0,
        backgroundColor: 'rgb(116, 148, 236)',
        borderRadius: 75,
        zIndex: Platform.select({ web: 1, default: 2 }),
        ...Platform.select({
            web: { left: 0, right: 0 },
            default: {},
        }),
    },
});

export default styles;