/**
 * This file contains the styles used for the Home screen.
 * It controls the layout of post cards, text, images, and action icons
 * to keep the interface simple, clean, and easy to use.
 *
 * Used in Home components across the Elysian app.
 */
import { StyleSheet, Dimensions } from "react-native";
const SCREEN_WIDTH = Dimensions.get("window").width;
const IMG_WIDTH = SCREEN_WIDTH - 75;

export const homeStyles = StyleSheet.create({

  homeContainer: {
    paddingTop: 40,
    paddingHorizontal: 20,
    justifyContent: "flex-start",
  },

  postContainer: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 35,
    marginBottom: 18,
    position: "relative",
    paddingBottom: 5,
  },

  imageContainer: {
    width: IMG_WIDTH,
    height: 225,
    borderRadius: 25,
    marginTop: 18,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },

  cityImage: {
    width: IMG_WIDTH,
    height: "100%",
  },

  cityOverlay: {
    position: "absolute",
    top: 120,
    left: 20,
    bottom: 20,
    pointerEvents: "none"
  },

  cityFont: {
    fontSize: 40,
    fontWeight: "600",
    color: "white",
  },

  countryFont: {
    fontSize: 20,
    fontWeight: "600",
    color: "white",
  },

  pinIcon: {
    flexDirection: "row",
  },

  ratingOverlay: {
    position: "absolute",
    alignItems: "center",
    top: 15,
    right: 15,
  },

  ratingTag: {
    backgroundColor: "white",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    borderColor: "white",
    borderWidth: 1,
    flexDirection: "row",
    gap: 2,
  },

  ratingFont: {
    color: "black",
    fontSize: 17,
    fontWeight: 600
  },

  contentContainer: {
    minHeight: 90,
    marginBottom: 18,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },

  uploader: {
    marginTop: 10,
    fontSize: 15,
    color: "black",
  },

  reviewFont: {
    top: 10,
    fontSize: 15,
    color: "black",
    marginBottom: 10,
  },

  date: { 
    fontSize: 15,
    color: "black",
    alignSelf: "flex-end",    
    top: 20,
  },

  postIcons: {
    position: "absolute",
    marginTop: 5,
    right: 15,
    flexDirection: "row",
    gap: 5,
  },

  postBlurContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
    pointerEvents: "none"
  },

  // Scroll indicator container (dots at bottom center of image)
  scrollIndicatorContainer: {
    position: "absolute",
    bottom: 10, // Distance from bottom of image
    alignSelf: "center",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  // Individual dot
  scrollDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.5)", // semi-transparent by default
    marginHorizontal: 3,
  },

  // Active dot (current image)
  activeScrollDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "white",
  },

}); 