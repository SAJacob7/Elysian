/**
 * This file contains the styles used for the Favorites screen.
 * It controls the layout of city cards, text, images, and action icons
 * to keep the interface simple, clean, and easy to use.
 *
 * Used in Favorites components across the Elysian app.
 */
import { StyleSheet } from "react-native";

export const itinerarySubTabStyles = StyleSheet.create({

    itineraryModalContainer: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "#fff",
        padding: 20,
        borderRadius: 20,
        zIndex: 1001, // above overlay
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
    },
    itineraryLoading: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    },
    itineraryEmpty: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    },
    itineraryGrid: {
        width: "50%",
        padding: 10,
    },
    itineraryCard: {
        height: 140,
        borderRadius: 12,
        overflow: "hidden",
        justifyContent: "flex-end",
        padding: 10,
        backgroundColor: "#e0e0e0", // light gray placeholder
    },
    itineraryTextBackground: {
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        padding: 6,
        borderRadius: 6,
    },
    itineraryCityText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "bold",
    },
    itineraryActivityText: {
        marginTop: 4,
        fontSize: 14,
        lineHeight: 20,
        color: "#333",
        marginBottom: 14,
    },
});
