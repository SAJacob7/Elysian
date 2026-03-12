/*
File: recommendations.tsx
Function: Shows one recommended city at a time based on the user’s recommendations page.
Users can swipe right to like or swipe left to skip. The app saves likes
and dislikes to Firebase, loads the next city from the backend, and lets
users double tap a city to open more details in a modal.
*/

import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Image,
  Pressable,
  Modal,
  Dimensions,
  PanResponder,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, Button } from "react-native-paper";
import { styles } from "./styles/app_styles.styles";
import { recommendationStyles } from "./styles/recommendations.styles";
import { Animated, Easing } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getAuth } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { FIREBASE_DB } from "../../FirebaseConfig";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import PenguinLoader from "./penguin_loader";

// Define the navigation parameter list
export type RootParamList = {
  Home: undefined;
  Recommendations: { recommendations: Recommendation[] };
  Liked: undefined;
};

interface Recommendation {
  city_id: string;
  city_name: string;
  country: string;
  score: number;
  description?: string;
  image?: string;
}

type City = {
  city_name: string;
  country_name: string;
  score: number;
};

// Home component
const Recommendations = () => {
  // Initialize navigation with type safety
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<Recommendation | null>(null);
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const position = useRef(new Animated.ValueXY()).current;
  const doubleTap = useRef<number | null>(null);
  const [currentCity, setCurrentCity] = useState<Recommendation | null>(null);
  const currentCityRef = useRef<Recommendation | null>(null);
  const [unsplashImageUrl, setUnsplashImageUrl] = useState<string | null>(null);
  // This will set the tags for the current city.
  const [currentCityAttr, setCurrentCityAttr] = useState<string | null>(null);
  const glassAvailable = isLiquidGlassAvailable();
  // Need to get the width and height of screen for the images to fit full page.
  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

  useEffect(() => {
    currentCityRef.current = currentCity;
  }, [currentCity]);
  useEffect(() => {
    const loadCityAttributes = async () => {
      if (!currentCity) return;

      const attrs = await getCityAttrs(currentCity.city_id);
      setCurrentCityAttr(attrs);
    };

    loadCityAttributes();
  }, [currentCity]);

  const fetchWikivoyageIntro = async (
    cityName: string,
    country: string
  ): Promise<string | null> => {
    const titlesToTry = [
      cityName,
      `${cityName}, ${country}`,
      `${cityName} (${country})`,
    ];

    for (const title of titlesToTry) {
      try {
        const url =
          `https://en.wikivoyage.org/w/api.php` +
          `?action=query&format=json&origin=*` +
          `&prop=extracts&exintro=1&explaintext=1&redirects=1` +
          `&titles=${encodeURIComponent(title)}`;

        const res = await fetch(url);
        const data = await res.json();

        const pages = data?.query?.pages;
        if (!pages) continue;

        const page = pages[Object.keys(pages)[0]];
        const extract = page?.extract;

        if (
          extract &&
          !extract.toLowerCase().includes("more than one place") &&
          !extract.toLowerCase().includes("may refer to")
        ) {
          return extract;
        }
      } catch {
        continue;
      }
    }

    return null;
  };


  const shorten = (text: string, sentences = 2, maxChars = 240) => {
    const cleaned = text.replace(/\s+/g, " ").trim();
    if (!cleaned) return "";

    // Take N sentences first
    const parts = cleaned.split(". ");
    let out = parts.slice(0, sentences).join(". ");
    if (!out.endsWith(".")) out += ".";

    // If still too long, hard cap, but end cleanly
    if (out.length > maxChars) {
      out = out.slice(0, maxChars).trimEnd();
      out = out.replace(/\s+\S*$/, ""); // drop partial last word
      // Prefer ending on sentence punctuation if we can
      const lastPunct = Math.max(
        out.lastIndexOf("."),
        out.lastIndexOf("!"),
        out.lastIndexOf("?")
      );
      if (lastPunct > 60) out = out.slice(0, lastPunct + 1);
      else out += "...";
    }

    return out;
  };

  const fetchCityInfo = async (cityName: string, country: string) => {
    try {
      // Wikivoyage only (text)
      const voyText = await fetchWikivoyageIntro(cityName, country);

      const descriptionRaw = voyText || "";
      const description = descriptionRaw
        ? makeTravelBlurb(descriptionRaw, cityName)
        : "No description available.";

      // IMPORTANT: no wikipedia image fallback at all
      return { description, image: undefined };
    } catch (err) {
      console.error("Error fetching city info:", err);
      return { description: "No description available.", image: undefined };
    }
  };

  const makeTravelBlurb = (raw: string, cityName: string) => {
    if (!raw || !raw.trim()) {
      return `${cityName} is a destination known for its culture, atmosphere, and local attractions.`;
    }
    const cleaned = raw
      .replace(/\s+/g, " ")
      .replace(/\[[^\]]*\]/g, "") // remove [1], [2]
      .trim();

    // Split into sentences
    const sentences = cleaned.split(/(?<=[.!?])\s+/).filter(Boolean);

    if (sentences.length === 0) {
      return `${cityName} is a destination known for its culture, atmosphere, and local attractions.`;
    }

    // Scoring helpers
    const positiveKeywords = [
      "known for", "famous for", "offers", "features", "boasts",
      "historic", "vibrant", "beautiful", "coastal", "mountain",
      "popular", "renowned"
    ];

    const negativeKeywords = [
      "danger", "unsafe", "avoid", "warning", "crime",
      "may refer to", "more than one place", "disambiguation"
    ];

    const scoreSentence = (s: string) => {
      let score = 0;
      const lower = s.toLowerCase();

      if (lower.includes(cityName.toLowerCase())) score += 1;
      if (positiveKeywords.some(k => lower.includes(k))) score += 1;
      if (/^[A-Z]/.test(s.trim())) score += 0.5; // starts clean
      if (s.length >= 60 && s.length <= 220) score += 1;

      if (negativeKeywords.some(k => lower.includes(k))) score -= 3;
      if (s.includes("(")) score -= 0.5;
      if (/[;:]/.test(s)) score -= 1;
      if (!/[.!?]$/.test(s)) score -= 1;

      return score;
    };

    // Score and sort
    const scored = sentences
      .map(s => ({ s, score: scoreSentence(s) }))
      .sort((a, b) => b.score - a.score);

    // Pick best 1–2 sentences
    const best = [scored[0]?.s].filter(Boolean);

    if (scored[1]) {
      const s2 = scored[1].s.trim();
      const startsClean = /^[A-Z]/.test(s2);
      const badStart = /^(and|but|however|although)\b/i.test(s2);

      if (startsClean && !badStart && s2.length <= 220) {
        best.push(s2);
      }
    }

    let out = best.join(" ").trim();

    // Ensure final punctuation
    if (!/[.!?]$/.test(out)) out += ".";

    // Soft length cap (sentence-safe)
    const maxChars = 260;
    if (out.length > maxChars) {
      const parts = out.split(/(?<=[.!?])\s+/);
      let trimmed = "";
      for (const p of parts) {
        if ((trimmed + " " + p).length > maxChars) break;
        trimmed += (trimmed ? " " : "") + p;
      }
      out = trimmed.trim();
    }

    // Final fallback if somehow empty
    if (!out) {
      return `${cityName} is a destination known for its culture, atmosphere, and local attractions.`;
    }

    return out;
  };

  const fetchUnsplashImage = async (cityName: string, country: string) => {
    try {
      const url =
        `https://capstone-team-generated-group30-project.onrender.com/api/city-image?city=${encodeURIComponent(
          cityName
        )}` + `&country=${encodeURIComponent(country)}`;

      const res = await fetch(url);
      // console.log("Res:");
      // console.log(res);
      if (!res.ok) return null;

      const json = await res.json();
      // console.log(json?.data?.imageUrl);
      return json?.data?.imageUrl ?? null;
    } catch (e) {
      console.error("Unsplash fetch error:", e);
      return null;
    }
  };

  useEffect(() => {
    const loadInitial = async () => {
      setLoading(true);
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error("No user");

        const city = await fetchNextCity(user.uid);
        const extra = await fetchCityInfo(city.city_name, city.country);

        setUnsplashImageUrl(null);

        const uImg = await fetchUnsplashImage(city.city_name, city.country);
        setUnsplashImageUrl(uImg);

        setCurrentCity({ ...city, ...extra });
        // console.log(currentCity);
      } catch (err) {
        console.error(err);
        setError("Failed to get recommendations");
      } finally {
        setLoading(false);
      }
    };

    loadInitial();
  }, []);

  const rightSwipe = async (cityId: string, city: City) => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      alert("Error, User must be signed in!");
      return;
    }

    try {
      const userDocRef = doc(FIREBASE_DB, "userFavorites", user.uid);
      await setDoc(
        userDocRef,
        {
          [`${cityId}`]: {
            ...city,
            image: unsplashImageUrl || null,
            description: currentCityRef.current?.description || null,
          },
        },
        { merge: true }
      );
      // await sendSwipe(user.uid, cityId, true); // Update backend with the swipe

      const nextCity = await fetchNextCity(user.uid);
      const extra = await fetchCityInfo(nextCity.city_name, nextCity.country);

      setUnsplashImageUrl(null);

      const uImg = await fetchUnsplashImage(
        nextCity.city_name,
        nextCity.country
      );
      setUnsplashImageUrl(uImg);

      setCurrentCity({ ...nextCity, ...extra });
    } catch (error) {
      console.error("Encountered an error while saving your favorites:", error);
      alert("Error, There was an error while saving your favorites.");
    }
  };

  const leftSwipe = async (cityId: string, city: City) => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      alert("Error, User must be signed in!");
      return;
    }

    try {
      const userDocRef = doc(FIREBASE_DB, "userDislikes", user.uid);
      await setDoc(userDocRef, { [`${cityId}`]: city }, { merge: true });
      // await sendSwipe(user.uid, cityId, false); // Update backend with the swipe
      const nextCity = await fetchNextCity(user.uid);
      const extra = await fetchCityInfo(nextCity.city_name, nextCity.country);

      setUnsplashImageUrl(null);
      const uImg = await fetchUnsplashImage(
        nextCity.city_name,
        nextCity.country
      );
      setUnsplashImageUrl(uImg);

      setCurrentCity({ ...nextCity, ...extra });
    } catch (error) {
      console.error("Encountered an error while saving your dislikes:", error);
      alert("Error, There was an error while saving your dislikes.");
    }
  };

  const getCityAttrs = async (cityId: string) => {
    try {
      const docRef = doc(FIREBASE_DB, "allCities", cityId);
      const cityResp = await getDoc(docRef);
      if (!cityResp.exists()) {
        console.warn("City not found:", cityId);
        return null;
      }
      const cityData = cityResp.data();
      return cityData.city_attrs || null;
    } catch (error) {
      console.error(
        "Encountered an error while getting city attributes",
        error
      );
      alert("Error, There was an error while getting city attributes");
    }
  };

  async function getUserProfileAnswers(userId: string) {
    const ref = doc(FIREBASE_DB, "userProfiles", userId);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      throw new Error("User profile not found");
    }

    const data = snap.data();
    const responses = data.responses;

    return {
      origin_country: responses[0],
      vacation_types: responses[1] || [],
      seasons: responses[2] || [],
      budget: responses[3] || [],
      favorite_country_visited: responses[4],
      place_type: responses[5] || [],
    };
  }

  async function fetchNextCity(userId: string) {
    // You need to supply the same profile answers you used to generate recs.
    // If you stored them in Firestore, read them here; for now assume you have them.
    const profile = await getUserProfileAnswers(userId);

    const res = await fetch(
      "https://capstone-team-generated-group30-project.onrender.com/next_city",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          ...profile,
        }),
      }
    );

    if (!res.ok) throw new Error("Failed to fetch next city");
    const json = await res.json();
    return json.city as Recommendation;
  }

  const swipeFunction = (direction: "left" | "right") => {
    if (!currentCityRef.current) return;

    const x = direction === "right" ? screenWidth : -screenWidth;
    Animated.timing(position, {
      toValue: { x, y: 0 },
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      const city = currentCityRef.current;
      if (!city) return;

      if (direction === "right") {
        rightSwipe(city.city_id, {
          city_name: city.city_name,
          country_name: city.country,
          score: city.score,
        });
      } else {
        leftSwipe(city.city_id, {
          city_name: city.city_name,
          country_name: city.country,
          score: city.score,
        });
      }
      position.setValue({ x: 0, y: 0 });
    });
  };

  const swipeAction = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponderCapture: (_, gesture) =>
        Math.abs(gesture.dx) > 10,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > 120) {
          swipeFunction("right");
        } else if (gesture.dx < -120) {
          swipeFunction("left");
        } else {
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  return (
    <SafeAreaView style={styles.solidSafeArea}>
      {/* Loading */}
      {loading && <PenguinLoader text="Finding your perfect destination..." />}

      {/* Error */}
      {error && !loading && <Text>{error}</Text>}

      {/* Current City Card */}
      {!loading && !error && currentCity && (
        <Animated.View
          style={[
            recommendationStyles.cityCardRecommendation,
            {
              width: screenWidth,
              height: screenHeight,
              transform: [
                { translateX: position.x },
                { translateY: position.y },
                {
                  rotate: position.x.interpolate({
                    inputRange: [-screenWidth, 0, screenWidth],
                    outputRange: ["-15deg", "0deg", "15deg"],
                  }),
                },
              ],
            },
          ]}
          {...swipeAction.panHandlers}
        >
          <Pressable
            onPress={() => {
              const now = Date.now();
              if (doubleTap.current && now - doubleTap.current < 300) {
                setSelectedCity({
                  ...currentCity,
                  image: unsplashImageUrl || undefined,
                });
                setCityModalOpen(true);
              }
              doubleTap.current = now;
            }}
          >
            {/* This is to make the full-screen image. */}
            {unsplashImageUrl || currentCity.image ? (
              <View style={recommendationStyles.cityImageContainerRec}>
                <Image
                  source={{ uri: unsplashImageUrl || currentCity.image }}
                  style={recommendationStyles.cityImageRecommendation}
                  resizeMode="cover"
                />

                {/* Dark blur overlay on bottom 1/3 */}
                <View style={recommendationStyles.bottomBlurOverlay}>
                  <MaskedView
                    maskElement={
                      <LinearGradient
                        colors={["transparent", "rgba(255,255,255,0.9)"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={{ flex: 1 }}
                      />
                    }
                    style={{ flex: 1 }}
                  >
                    <BlurView intensity={100} tint="dark" style={{ flex: 1 }} />
                  </MaskedView>
                </View>
              </View>
            ) : (
              <View style={recommendationStyles.cityImagePlaceholderRec} />
            )}
            {/* Put the city/country name on the image */}
            <View style={recommendationStyles.cityInfoRec}>
              <Text style={recommendationStyles.cityNameRec}>
                {currentCity.city_name}, {"\n"}
                {currentCity.country}
              </Text>
              {currentCityAttr && (
                <View style={recommendationStyles.cityTagContainer}>
                  {currentCityAttr.split("|").map((tag, index) =>
                    glassAvailable ? ( // Check if glass UI is available.
                      <GlassView
                        key={index}
                        style={recommendationStyles.glassTag}
                      >
                        <Text style={recommendationStyles.tagText}>{tag}</Text>
                      </GlassView>
                    ) : (
                      // If there is no Glass UI available on the phone, do regular UI.
                      <View key={index} style={recommendationStyles.tag}>
                        <Text style={recommendationStyles.tagText}>{tag}</Text>
                      </View>
                    )
                  )}
                </View>
              )}
            </View>
          </Pressable>
        </Animated.View>
      )}

      {/* City Modal */}
      <Modal
        visible={cityModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCityModalOpen(false)}
      >
        {/* Full-screen dim overlay */}
        <Pressable
          style={styles.modalDimOverlay}
          onPress={() => setCityModalOpen(false)}
        >
          {/* Stop propagation so modal content doesn't close when tapped */}
          <Pressable style={{
            maxHeight: "60%", minHeight: "30%",
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
            overflow: "hidden",
            width: "90%"
          }}>
            {selectedCity && (
              <View style={styles.cityModalContent}>
                {selectedCity.image && (
                  <Image
                    source={{ uri: selectedCity.image }}
                    style={styles.cityModalImage}
                    resizeMode="cover"
                  />
                )}

                <Text style={styles.cityModalTitle}>
                  {selectedCity.city_name}, {selectedCity.country}
                </Text>

                <Text style={styles.cityModalDescriptionLabel}>
                  Description:
                </Text>

                {/* Visible description */}
                <Text style={styles.cityModalDescription}>
                  {selectedCity.description || "No description available."}
                </Text>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};
export default Recommendations;
