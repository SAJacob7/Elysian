import { StyleSheet } from "react-native";

export const createPostStyles = StyleSheet.create({

    homeContainer: {
        paddingHorizontal: 20,
        paddingTop: 40,
        paddingBottom: 40,
        backgroundColor: "white",
        position: "relative"
    },

    title: {
        textAlign: "center",
        fontWeight: "700",
        fontSize: 30,
        color: "#000",
        marginBottom: 10,
        marginTop: -20,
    },

    feedbackQuestionHeader: {
        textAlign: "left",
        color: "#000",
        fontWeight: 700,
        fontSize: 18,
        marginRight: 12
    },

    comparisonQuestionHeader: {
        color: "#000",
        fontSize: 18,
        fontWeight: 700,
        marginHorizontal: 10
    },

    imageRow: {
        flexDirection: "row",
        paddingHorizontal: 16,
        marginTop: 10,
    },

    imagePreview: {
        width: 130,
        height: 130,
        borderRadius: 20,
        marginRight: 10,
    },

    input: {
        backgroundColor: "transparent",
        marginHorizontal: 12,
        marginTop: 30
    },

    dropdown: {
        maxHeight: 110,
        backgroundColor: "#fff",
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "rgba(174, 170, 170, 0.15)",
        overflow: "hidden",
        top: 310,
        marginHorizontal: 12,
        position: "absolute",
        zIndex: 1000,
        left: 20,
        right: 20
    },

    dropdownItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },

    reviewInput: {
        marginTop: 16,
        marginHorizontal: 12,
        minHeight: 105,
        maxHeight: 105,
        textAlignVertical: "top",
        backgroundColor: "transparent",
        marginBottom: 16
    },

    feedbackLayout: { 
        flexDirection: "row", 
        alignItems: "center",
        marginHorizontal: 12,
        marginBottom: 14
    },

    iconsLayout: { 
        flexDirection: "row",
        gap: 10,
        marginLeft: 8
    },

    imageComparisonContainer: {
        flexDirection: "row",
        gap: 20,
        marginTop: 20,
        alignItems: "center",
        justifyContent: "center",
    },

    imageCard: {
        width: 130,
        height: 130,
        borderRadius: 20,
        overflow: "hidden",
        position: "relative",
    },

    comparisonImage: {
        width: "100%",
        height: "100%",
    },

     imageCenterOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,

        justifyContent: "center",  // vertical center
        alignItems: "center",      // horizontal center

        backgroundColor: "rgba(0,0,0,0.35)", // optional dark overlay
    },


    imageText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: 700,
        textAlign: "center",
    },

    vsContainer: {
        paddingHorizontal: 9,
        justifyContent: "center",
        alignItems: "center",
    },

    vsText: {
        fontSize: 18,
        fontWeight: 700,
        color: "#000",
    },

    ratingResultContainer: {
        marginTop: 20,
        marginHorizontal: 12, // left and right spacing
    },

    ratingResultNumber: {
        fontSize: 18,
        fontWeight: 700,
        color: "#000",
        marginBottom: 30, // space between number and stars
        textAlign: "left", // keep the rating number left-aligned
    },

    starContainer: {
        flexDirection: "row",
        gap: 10, // spacing between stars
    },

    uploadOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,

        backgroundColor: "rgba(0,0,0,0.4)",

        justifyContent: "center",
        alignItems: "center",

        zIndex: 9999,
    }
})