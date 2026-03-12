/**
 * Recommendation Styles
 *
 * This file contains the styles for the Recommendation screen.
 * It controls the layout of city images, text overlays, and tags
 * to highlight suggested destinations in a clear + visually
 * engaging way.
 *
 * Used in recommendation related components.
 */

import { StyleSheet } from "react-native";

export const recommendationStyles = StyleSheet.create({
  cityCardRecommendation: {
    position: "absolute",
    top: 0,
    left: 0,
  },

  cityImageRecommendation: {
    width: "100%",
    height: "100%",
    borderRadius: 60,
  },

  cityImagePlaceholderRec: {
    width: "100%",
    height: "100%",
    backgroundColor: "#333",
  },

  cityInfoRec: {
    position: "absolute",
    bottom: 150,
    left: 40,
    right: 20,
  },

  cityNameRec: {
    fontSize: 45,
    fontWeight: "800",
    color: "white",
    marginBottom: 25,
  },

  cityTagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 2,
    gap: 12,
  },

  glassTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#616161",
  },

  tagText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
  },

  tag: {
    backgroundColor: "rgba(111, 106, 106, 0.4)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderColor: "rgba(33, 30, 30, 0.64)",
  },

  cityImageContainerRec: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
    overflow: "hidden",
  },

  bottomBlurOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: "hidden",
  },
});
