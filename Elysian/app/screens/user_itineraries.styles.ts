/**
 * This file contains the styles used for the Favorites screen.
 * It controls the layout of city cards, text, images, and action icons
 * to keep the interface simple, clean, and easy to use.
 *
 * Used in Favorites components across the Elysian app.
 */
import { StyleSheet } from "react-native";

export const itinerarySubTabStyles = StyleSheet.create({

    searchModalContainer: {
        position: "absolute",
        top: "35%",
        bottom: "35%",
        left: "5%",
        right: "5%",
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
        aspectRatio: 1,
        height: 140,
        borderRadius: 12,
        overflow: "hidden",
        justifyContent: "flex-end",
        padding: 10,
        backgroundColor: "#e0e0e0",
    },
    itineraryCityText: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "bold",
    },
    itineraryCardTextContainer: {
        position: "absolute",
        bottom: 10,
        left: 16,
        right: 16,
    },
    itineraryCardBlurContainer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: "70%",
    },
    itineraryActivityText: {
        marginTop: 4,
        fontSize: 14,
        lineHeight: 20,
        color: "#333",
        marginBottom: 14,
    },
    shareIcon: {
        position: "absolute",
        top: 5,
        right: 1,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        zIndex: 10,
    },
    shareTitle: {
        fontSize: 18,
        fontWeight: "600",
        marginTop: 12,
        marginBottom: 12,
        textAlign: "center",
    },

    searchInput: {
        flex: 1,
        backgroundColor: "transparent",
        marginRight: 8,
    },


    searchResultRow: {
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
        justifyContent: "space-between",
        flexDirection: "row",
    },

    searchResultUsername: {
        fontSize: 16,
        fontWeight: "500",
    },

    activityInput: {
        width: "100%",
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 16,
        backgroundColor: "#fff",
        marginTop: 15,
        marginBottom: 10,
    },
    shareOverlay: {
        position: "absolute",
        alignItems: "center",
        top: 7,
        right: 7,
    },

    shareTag: {
        backgroundColor: "white",
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 20,
        borderColor: "white",
        borderWidth: 1,
        flexDirection: "row",
        gap: 2,
    },
    sharedWithText: {
        marginTop: 6,
        fontSize: 14,
        color: "#666",
    },

    sharedWithNames: {
        fontWeight: "600",
        color: "#333",
    },

    activitiesContainer: {
        marginTop: 16,
    },

    activityRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 10,
    },

    activityBullet: {
        fontSize: 16,
        lineHeight: 20,
        marginRight: 8,
        color: "#444",
    },

    activityText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
        color: "#333",
    },
    likeCount: {
        marginLeft: 6,
        fontSize: 14,
        color: "#333",
        alignSelf: "center",
    },






});
