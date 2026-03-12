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
    top: "30%",
    bottom: "30%",
    left: "5%",
    right: "5%",
    backgroundColor: "#FFFDFC",
    padding: 20,
    borderRadius: 40,
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
    alignItems: "center",
  },

  itineraryEmpty: {
    flex: 1,
    marginTop: -160,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyText: {
    paddingTop: 10,
    fontSize: 20,
    fontWeight: "600",
    color: "#63a4e1",
  },

  itineraryActivityText: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    color: "#333",
    marginBottom: 14,
  },

  shareTitle: {
    fontSize: 25,
    fontWeight: "700",
    textAlign: "center",
  },

  shareCitySubtitle: {
    fontSize: 18,
    fontWeight: "600",
    marginVertical: 12,
    textAlign: "center",
    color: "#807f7fff",
  },

  searchInput: {
    flex: 1,
    backgroundColor: "transparent",
    marginRight: 8,
  },

  searchResultRow: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    justifyContent: "space-between",
    flexDirection: "row",
  },

  searchResultUsername: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
  },

  addActivityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
  },

  activityInputBar: {
    flex: 1,
    paddingVertical: 10,
    height: 45,
    overflow: "hidden",
    // Glass look
    borderRadius: 26, // Rounded

    // Glass effect border
    borderWidth: 1,
    borderColor: "rgba(174, 170, 170, 0.15)",

    flexDirection: "row",
    alignItems: "center",
    zIndex: 10,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },

  shareOverlay: {
    position: "absolute",
    alignItems: "center",
    top: 8,
    right: 8,
  },

  shareTag: {
    width: 30,
    height: 30,
    backgroundColor: "white",
    borderRadius: 15,
    borderColor: "white",
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  sharedWithText: {
    marginVertical: 6,
    fontSize: 16,
    fontWeight: "600",
    color: "#807f7fff",
  },

  sharedWithNames: {
    fontSize: 16,
    fontWeight: "400",
    color: "#807f7fff",
  },

  sharedInputBar: {
    marginVertical: 10,
    paddingVertical: 10,
    height: 45,
    overflow: "hidden",
    // Glass look
    borderRadius: 26, // Rounded

    // Glass effect border
    borderWidth: 1,
    borderColor: "rgba(174, 170, 170, 0.15)",

    flexDirection: "row",
    alignItems: "center",
    zIndex: 10,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },

  activitiesContainer: {
    marginTop: 10,
  },

  activityRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },

  activityLabelText: {
    marginVertical: 10,
    fontSize: 22,
    fontWeight: "700",
    color: "#000",
  },

  activityBullet: {
    fontSize: 16,
    lineHeight: 20,
    marginRight: 8,
    color: "#000",
  },

  activityText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 20,
    color: "#000",
  },

  likeContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: 60,
    justifyContent: "flex-end",
    gap: 4,
  },

  likeCount: {
    fontSize: 16,
    minWidth: 20,
    textAlign: "center",
  },
});
