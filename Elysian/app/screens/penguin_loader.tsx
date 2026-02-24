/**
 * File: penguin_loader.tsx
 *
 * This file is to create a loading screen with a walking penguin.
 * This can be exported and used by other pages.
 */


import React, { useEffect, useRef, useState } from "react";
import { View, Animated, Dimensions } from "react-native";
import { Text } from "react-native-paper";
import { penguinLoaderStyles } from "./penguin_loader.styles";

interface Props {
  size?: number;
  text?: string;
  textColor?: string;
}

const PenguinLoader: React.FC<Props> = ({
  size = 150,
  text = "Loading...",
  textColor = "black"
}) => {
  const stepDuration = 250;
  const speed = 80;
  const screenWidth = Dimensions.get("window").width;
  const startX = screenWidth * 0.25 - size / 2;
  const endX = screenWidth * 0.75 - size / 2;

  const position = useRef(new Animated.Value(startX)).current;
  const [spriteIndex, setSpriteIndex] = useState(0);

  // Sprite alternation
  useEffect(() => {
    const interval = setInterval(() => {
      setSpriteIndex(prev => (prev === 0 ? 1 : 0));
    }, stepDuration);
    return () => clearInterval(interval);
  }, [stepDuration]);

  // Movement left → right with smooth reset
  useEffect(() => {
    const animate = () => {
      const distance = endX - startX;
      const duration = (distance / speed) * 1000;

      position.setValue(startX); // start from left
      Animated.timing(position, {
        toValue: endX,
        duration,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          // quick reset back to start
          position.setValue(startX);
          animate(); // loop again
        }
      });
    };

    animate();
  }, [startX, endX, speed]);

  const sprites = [
    require("../../assets/penguin_sprite_1.png"),
    require("../../assets/penguin_sprite_2.png"),
  ];

  return (
    <View style={penguinLoaderStyles.container}>
      <Animated.Image
        source={sprites[spriteIndex]}
        style={{
          width: size,
          height: size,
          transform: [{ translateX: position }],
        }}
        resizeMode="contain"
      />
      <Text variant="headlineMedium" style={[penguinLoaderStyles.text, { color: textColor }]}>{text}</Text>
    </View>
  );
};

export default PenguinLoader;