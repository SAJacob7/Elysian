import { useEffect, useRef } from "react";
import { View, ImageBackground, Animated } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { styles } from "./styles/app_styles.styles";

export type RootParamList = {
  Login: undefined;
  Home: undefined;
  Landing: undefined;
};

type LandingScreenProp = NativeStackNavigationProp<RootParamList, "Landing">;

const Landing = () => {
  const navigation = useNavigation<LandingScreenProp>();

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const AnimatedImageBackground =
    Animated.createAnimatedComponent(ImageBackground);

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        navigation.replace("Login");
      });
    }, 1500);

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim, navigation]);

  return (
    <View style={styles.landingContainer}>
      {/* Animated background image */}
      <AnimatedImageBackground
        source={require("../../assets/landing_page_background.png")}
        style={[
          styles.landingBackground,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
        resizeMode="cover"
      />

      {/* Text fades with the background */}
      <Animated.Text
        style={[
          styles.landingTitle,
          {
            opacity: fadeAnim, // Apply same fade
          },
        ]}
      >
        Elysian
      </Animated.Text>
    </View>
  );
};

export default Landing;
