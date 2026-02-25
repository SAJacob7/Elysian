import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  landingContainer: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 150, // control how far from top
  },

  landingTitle: {
    justifyContent: "flex-start",
    paddingTop: 50,
    fontSize: 70,
    textAlign: "center",
    fontWeight: "bold",
    color: "white",
  },

  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    paddingHorizontal: 20,
    backgroundColor: "white",
  },

  button: {
    width: "40%",
    alignSelf: "center",
    borderRadius: 999,
    backgroundColor: "#000",
    paddingVertical: 5,
  },

  buttonLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },

  title: {
    marginBottom: 24,
    textAlign: "center",
    fontWeight: "bold",
    color: "black",
  },

  subtext: {
    marginBottom: 24,
    textAlign: "center",
    color: "#7D848D",
  },

  input: {
    marginBottom: 16,
    paddingHorizontal: 10,
    height: 60,
    fontSize: 18,
  },

  signupContainer: {
    marginTop: 30,
    alignItems: "center",
  },

  signupLink: {
    color: "#95CD00",
    fontWeight: "600",
  },

  image: {
    width: 350,
    height: 350,
    marginTop: 20,
  },

  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 10, // Minimal vertical spacing
    columnGap: 10, // Consistent spacing between columns (if RN 0.71+)
  },

  answerButton: {
    flexBasis: "48%", // Two buttons per row
    height: 120,
    backgroundColor: "#F7F7F9", // Same light gray as input background
    borderColor: "#E5E5E5",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000", // Subtle shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },

  answerButtonSelected: {
    backgroundColor: "#008CFF", // Brand blue when selected
    shadowOpacity: 0.2,
  },

  answerText: {
    color: "#1B1E28",
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },

  answerTextSelected: {
    color: "#FFFFFF", // White text on blue button
    fontWeight: "700",
  },

  questionText: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#1B1E28",
    marginBottom: 24,
    paddingHorizontal: 10,
  },

  safeArea: {
    flex: 1,
    backgroundColor: "#white", // -> Change to transparent for background image to show
    
  },
  
  homeContainer: {
    flexGrow: 1,
    justifyContent: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 0, // Remove extra bottom space
    backgroundColor: "white", // Remove for background image to show
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#1B1E28",
  },

  pageTitle: {
    textAlign: "left",
    fontWeight: "800",
    fontSize: 45,
    lineHeight: 45,
    color: "#000",
    marginBottom: 20,
    marginTop: -20,
  },

  loader: {
    marginTop: 20,
  },
  // --- CITY INFO MODAL ---

  cityModalContainer: {
    position: "absolute",
    top: "20%",
    bottom: "20%",
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

  cityModalContent: {
    flexGrow: 0,
    paddingBottom: 10,
  },

  cityModalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1B1E28",
    marginBottom: 10,
  },

  cityModalImage: {
    width: "100%",
    height: 180,
    borderRadius: 16,
    marginBottom: 12,
  },

  cityModalDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: "#333",
    marginBottom: 14,
  },

  cityModalCloseBtn: {
    borderRadius: 999,
    backgroundColor: "#008CFF",
    marginTop: 10,
  },

  cityModalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(102, 102, 102, 0.5)", // dimmed background
    zIndex: 1000,
  },

  cityModalInner: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between", // pushes button to bottom
  },

  topRightIcon: {
    // Search icon and menu icon
    position: "absolute",
    top: 75,
    right: 30,
    zIndex: 10,
  },

  topLeftIcon: {
    // Back arrow icon
    position: "absolute",
    top: 75,
    left: 30,
    zIndex: 11,
  },

  // ---------------------- Used on Navigation Bar page ------------------------------
  navBar: {
    position: "absolute",
    bottom: 45,
    width: "75%",
    height: 60,
    backgroundColor: "#000",
    borderRadius: 50,
    paddingHorizontal: 20,
    marginLeft: "12.5%",
    marginRight: "12.5%",
    borderTopWidth: 0,
  },

  navBarIcons: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: 7,
  },

  // ---------------------- Used on Home page ------------------------------
  floatingUploadButton: {
    position: "absolute",
    top: 50,
    right: 20,
    width: 55,
    height: 55,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  uploadIcon: {
    fontSize: 32,
    color: "#000",
  },
  post: {
    marginBottom: 16,
    alignItems: "center",
  },

  uploadingIndicator: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -25,
    marginTop: -25,
    zIndex: 100,
  },

  searchOverlay: {
    position: "absolute",
    top: 0, // Align with itinerary icon
    right: 0,
    width: "100%",
    paddingHorizontal: 15,
    zIndex: 10,
  },
  
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 60,
  },

  searchBarExpanded: {
    position: "absolute",
    top: 77,
    left: 30,
    right: 15,
    width: "75%",
    height: 45,

    // Glass look
    borderRadius: 26, // Rounded
    overflow: "hidden",

    // Glass effect border
    borderWidth: 1,
    borderColor: "rgba(174, 170, 170, 0.15)",

    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    zIndex: 10,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },

  searchInput: {
    flex: 1,
    backgroundColor: "transparent",
    marginRight: 8,
  },

  searchDropdown: {
    position: "absolute",
    top: 130,
    left: 30,
    right: 30,
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(174, 170, 170, 0.15)",
    maxHeight: 220,
    zIndex: 9,
    overflow: "hidden",
  },

  searchResultItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  searchBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
  },
  glassButton: {
    padding: 10,
    borderRadius: 50,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(174, 170, 170, 0.15)",
  },
});

export const inputTheme = {
  roundness: 50,
  colors: {
    primary: "#008CFF", // Underline and label when focused
    background: "#F7F7F9", // Input background color
    text: "#1B1E28", // Input text color
    placeholder: "#807f7fff", // Label/placeholder color
    outline: "transparent",
  },
};

export const selectedColors = ["#95CD00", "#F49F9A", "#FBD605"];
