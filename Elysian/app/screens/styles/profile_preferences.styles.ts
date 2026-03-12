/**
 * This file contains the styles for the Profile Preferences screen.
 * It controls the layout for the profile header, user details,
 * question sections, and action buttons to keep the screen organized
 * and easy to read.
 * Used in profile and preferences related components.
 */

import { StyleSheet } from "react-native";

export const profilePreferencesStyles = StyleSheet.create({
  profileHeader: {
    alignItems: "flex-end", // vertically center text with image
    paddingHorizontal: 40,
    paddingTop: 20,
  },

  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: "#fff",
  },

  name: {
    fontSize: 18,
    fontWeight: "600",
  },

  username: {
    fontSize: 14,
    color: "#999",
  },

  content: {
    flex: 1,
    marginTop: 10,
    paddingHorizontal: 40,
  },

  questionBlock: {
    marginBottom: 20,
  },

  questionText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
    color: "#000",
  },

  answerPill: {
    backgroundColor: "#f7f7f7",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "transparent",
    elevation: 2,
  },

  answerText: {
    fontSize: 14,
    fontWeight: 500,
    color: "#000",
  },
});
