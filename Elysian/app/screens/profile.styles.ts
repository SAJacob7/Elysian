/**
 * This file contains the styles for the Profile screen.
 * It defines the layout for the header image, profile photo,
 * user details, and edit actions to create a clean and
 * visually balanced profile page.
 *
 * Used in profile related components across the app.
 */

import { StyleSheet } from "react-native";

export const profileStyles = StyleSheet.create({
  topImageContainer: {
    position: "absolute",
    top: -10,
    left: -150,
    height: "50%",
    width: "100%",
  },

  topImage: {
    width: "200%",
    height: "100%",
  },

  halfCircleCutout: {
    position: "absolute",
    bottom: -320, // controls how deep the curve goes
    left: "28%",
    transform: [{ translateX: -150 }],
    width: 800,
    height: 400,
    borderTopLeftRadius: 400,
    borderTopRightRadius: 400,
    backgroundColor: "white",
  },

  profileImageContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: 75,
  },

  profileImage: {
    height: 100,
    width: 100,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: "#fff",
  },

  editIconContainer: {
    // Pen icon near profile picture
    height: 31,
    width: 31,
    borderRadius: 15,
    backgroundColor: "black",
    alignItems: "center",
    justifyContent: "center",
    marginTop: -30,
    marginLeft: 70,
  },

  nameContainer: {
    alignItems: "center",
    marginVertical: 10,
  },

  name: {
    fontSize: 30,
    fontWeight: 600,
    marginBottom: 5,
    color: "white",
  },

  username: {
    fontSize: 18,
    color: "white",
    marginBottom: 10,
  },

  editError: {
    // Error message for editing name and username
    fontSize: 15,
    color: "red",
    marginBottom: 5,
  },

  container: {
    flex: 1,
    justifyContent: "center",
    padding: 80,
    paddingHorizontal: 20,
  },

  editModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  editModalContent: {
    width: "90%",
    height: "45%",
    padding: 40,
    backgroundColor: "#fff",
    borderRadius: 16,
    justifyContent: "center",
  },

  editModalTitle: {
    fontSize: 25,
    fontWeight: "800",
    color: "#1B1E28",
    marginBottom: 25,
  },

  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    padding: 6,
    zIndex: 10,
    borderRadius: 50,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(174, 170, 170, 0.15)",
  },
  closeButtonShared: {
    position: "absolute",
    top: 0,
    right: 0,
    padding: 6,
    zIndex: 10,
    borderRadius: 50,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(174, 170, 170, 0.15)",
  },
  sharedInput: {
    backgroundColor: "transparent",
    marginHorizontal: 12,
    marginTop: 30
  },
  activityInput: {
    backgroundColor: "transparent",
    marginTop: 10,
    marginBottom: 10,
  },


});
