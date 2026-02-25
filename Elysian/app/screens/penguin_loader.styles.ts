import { StyleSheet } from "react-native";

export const penguinLoaderStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-start",
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },

  text: {
    paddingHorizontal: 50,
    marginTop: 20,
    fontSize: 30,
    fontWeight: 700,
    alignSelf: "center",
    textAlign: "center"
  },
});

