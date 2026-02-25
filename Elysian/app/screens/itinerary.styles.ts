/**
 * This file contains the styles for the Itinerary screen.
 * It defines the layout for the itineraries, search bar, and filters.
 * Used in itinerary related components across the app.
 */

import { StyleSheet } from "react-native";

export const itineraryStyles = StyleSheet.create({
    // Add these inside your StyleSheet.create({...})

    itineraryBuilderWrapper: {
        flex: 1,
        paddingHorizontal: 18,
        paddingTop: 12,
    },

    itineraryCityHeaderRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 18,
    },

    itineraryCityTitleWrap: {
        flex: 1,
        alignItems: "center",
    },

    itineraryCityName: {
        fontSize: 26,
        fontWeight: "700",
        color: "#000",
    },

    itineraryCountryName: {
        fontSize: 16,
        fontWeight: "400",
        color: "#555",
        marginTop: -2,
    },

    // ===== Title overlay (search mode) =====
    itineraryTitleWrapper: {
        position: "absolute",
        top: 90,
        left: 0,
        right: 0,
        alignItems: "center",
    },

    itineraryTitle: {
        fontSize: 42,
        fontWeight: "700",
        textAlign: "center",
        color: "#000",
        lineHeight: 44,
    },

    // ===== Category Pills =====
    itineraryPillsRow: {
        marginTop: 10,
        maxHeight: 50,
    },

    itineraryPillsContent: {
        paddingHorizontal: 4,
        alignItems: "center",
    },

    itineraryPill: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: "rgba(0,0,0,0.08)",
        marginRight: 10,
    },

    itineraryPillSelected: {
        backgroundColor: "#000",
    },

    itineraryPillText: {
        fontSize: 14,
        color: "#000",
        fontWeight: "500",
    },

    itineraryPillTextSelected: {
        color: "#fff",
    },

    // ===== Activities List =====
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

    // ===== Generate Button =====
    itineraryGenerateBtn: {
        backgroundColor: "#000",
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 20,
    },

    itineraryGenerateBtnDisabled: {
        backgroundColor: "#999",
    },

    itineraryGenerateBtnText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    itineraryActivitiesWrap: {
        flex: 1,
        marginTop: 16,
        backgroundColor: "rgba(255,255,255,0.6)",
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingTop: 12,
        overflow: "hidden",
    },




});