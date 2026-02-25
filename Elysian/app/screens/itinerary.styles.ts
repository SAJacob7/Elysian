/**
 * This file contains the styles for the Itinerary screen.
 * It defines the layout for the itineraries, search bar, and filters.
 * Used in itinerary related components across the app.
 */

import { StyleSheet } from "react-native";

export const itineraryStyles = StyleSheet.create({
    // Add these inside your StyleSheet.create({...})

    pageContainer: {
        flex: 1
    },

    itineraryCityHeaderRow: {
        alignItems: "center",
        marginBottom: 18,
        paddingHorizontal: 18,
        paddingTop: 12
    },

    itineraryCityName: {
        fontWeight: "800",
        fontSize: 30,
        color: "#000",
        textAlign: "center"
    },

    itineraryCountryName: {
        fontSize: 20,
        fontWeight: "600",
        color: "#555",
        textAlign: "center"
    },

    container: {
        flex: 1,
        paddingTop: 120,
        alignItems: "center",       // horizontal center
        paddingHorizontal: 30,
    },

    itineraryTitle: {
        fontWeight: "800",
        fontSize: 50,
        textAlign: "center",
        color: "#000",
    },

    itineraryDescription: {
        fontSize: 20,
        textAlign: "center",
        paddingHorizontal: 20,
        marginTop: 35
    },

    itineraryPillsRow: {
        marginTop: 10,
        maxHeight: 50,
    },

    itineraryPillsContent: {
        paddingLeft: 20, 
        alignItems: "center",
    },

    itineraryPill: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 20,
        backgroundColor: "white",
        marginRight: 10,
    },

    itineraryPillSelected: {
        backgroundColor: "#000",
    },

    itineraryPillText: {
        fontSize: 16,
        color: "#000",
        fontWeight: "500",
    },

    itineraryPillTextSelected: {
        color: "#fff",
    },

    itineraryActivityRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderColor: "rgba(0,0,0,0.08)",
    },

    itineraryCheckbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: "#000",
        marginRight: 12,
    },

    itineraryCheckboxChecked: {
        backgroundColor: "#000",
    },

    itineraryActivityText: {
        fontSize: 16,
        color: "#000",
    },

    itineraryActivitiesWrap: {
        marginTop: 16,
        borderRadius: 16,
        paddingHorizontal: 40,
        paddingTop: 12,
    },

    bottomImage: {
        width: 200,
        height: 200,
        marginTop: 30
    },

    errorText: {
        color: "#888", 
        padding: 12
    }

});