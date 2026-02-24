/*
File: create_post.tsx
Function: Allow users to add the location, a review, and generate a rating.
*/

import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Image,
  Pressable,
  ScrollView,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, TextInput } from "react-native-paper";
import { styles, inputTheme } from "./app_styles.styles";
import { createPostStyles } from "./create_post.styles";

import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  doc,
  updateDoc,
  increment,
  getDocs,
  collection,
  getDoc,
  setDoc,
  addDoc,
  arrayUnion
} from "firebase/firestore";
import { FIREBASE_DB } from "../../FirebaseConfig";

import { Ionicons, Entypo } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { GlassView } from "expo-glass-effect";
import type { HomeStackParamList } from "./navigation_bar";
import PenguinLoader from "./penguin_loader";

type CreatePostRouteProp = RouteProp<HomeStackParamList, "CreatePost">;

interface City {
  id: string;
  name: string;
  country: string;
}

const CreatePost = () => {
    const navigation = useNavigation();
    const route = useRoute<CreatePostRouteProp>();
    const imageURIs = route.params?.imageURIs;

    const [searchQuery, setSearchQuery] = useState("");
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [cities, setCities] = useState<City[]>([]);
    const [selectedCity, setSelectedCity] = useState<City | null>(null);
    const [review, setReview] = useState("");
    const [feedBack, setFeedback] = useState<"LIKE" | "NEUTRAL" | "DISLIKE" | null>(null);

    const [comparison, setComparison] = useState<null | 
        {new_city: {id: string; city_name: string, country_name: string};
        existing_city: {id: string; city_name: string, country_name: string};}>
        (null);
    const [ratingStarted, setRatingStarted] = useState(false);
    const [ratingCompleted, setRatingCompleted] = useState(false);
    
    const newCityImageRef = useRef<string | null>(null);
    const [comparisonImages, setComparisonImages] = useState<{
        new?: string | null;
        existing?: string | null;
    }>({});
    const [pendingRatingUpdates, setPendingRatingUpdates] = useState<any>(null);

    const [ratingValue, setRatingValue] = useState<number | null>(null);

    const [uploading, setUploading] = useState(false); // Tracks whether an image is currently uploading
    const [userName, setUserName] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);

    const fetchAllCities = async () => {
        try {
            const uid = getAuth().currentUser?.uid;
            if (!uid) return;

            // Fetch user's personalElos
            const userRef = doc(FIREBASE_DB, "userPosts", uid);
            const userSnap = await getDoc(userRef);

            const personalElos = userSnap.exists()
                ? userSnap.data().personalElos || {}
                : {};

            const ratedCityIds = new Set(Object.keys(personalElos));

            // Fetch all cities
            const citiesCol = collection(FIREBASE_DB, "allCities");
            const snapshot = await getDocs(citiesCol);

            // Filter out already rated cities
            const citiesList: City[] = snapshot.docs
                .filter(doc => !ratedCityIds.has(doc.id))
                .map(doc => ({
                    id: doc.id,
                    name: doc.data().city_name,
                    country: doc.data().country_name,
                }));

            setCities(citiesList);

        } catch (err) {
            console.error("Error fetching cities:", err);
        }
    };

    useEffect(() => {
        fetchAllCities();
         const auth = getAuth();
            const user = onAuthStateChanged(auth, async (user) => {
              if (user) {
                setUserId(user.uid);
                
                try {
                  const userDocRef = doc(FIREBASE_DB, "users", user.uid);
                  const userSnap = await getDoc(userDocRef);
        
                  if (userSnap.exists()){
                    const userData = userSnap.data();
                    setUserName(userData.username);
                  }
                }
                catch (error) {
                  console.error("Error fetching username: ", error);
                }
              }
            });
            return user;
    }, []);

    useEffect(() => {
        const hideListener = Keyboard.addListener("keyboardDidHide", () => {
            setDropdownOpen(false);
        });

        return () => {
            hideListener.remove();
        };
    }, []);

    const fetchUnsplashImage = async (cityName: string, country: string) => {
        try {
            const url =
                `https://capstone-team-generated-group30-project.onrender.com/api/city-image?city=${encodeURIComponent(
                cityName
                )}` + `&country=${encodeURIComponent(country)}`;

            const res = await fetch(url);

            if (!res.ok) {
                console.log("Fetch failed:", res.status);
                return null;
            }

            const json = await res.json();

            console.log("API response:", json);

            return json?.data?.imageUrl ?? null;

        } catch (e) {
            console.error("Unsplash fetch error:", e);
            return null;
        }
    };

    useEffect(() => {
        if (!comparison) return;
        console.log("Comparing?")
        console.log(comparison)

        const loadImages = async () => {

            let newImg = newCityImageRef.current;

            // Fetch new city image ONLY if not cached
            if (!newImg) {
                newImg = await fetchUnsplashImage(
                    comparison.new_city.city_name,
                    comparison.new_city.country_name
                );

                newCityImageRef.current = newImg;
                console.log(newCityImageRef);
            }

            // Always fetch existing city image (it changes)
            const existingImg = await fetchUnsplashImage(
                comparison.existing_city.city_name,
                comparison.existing_city.country_name
            );

            console.log(existingImg);

            setComparisonImages({
                new: newImg,
                existing: existingImg
            });        };

        loadImages();

    }, [comparison]); 

    useEffect(() => {
        newCityImageRef.current = null;
    }, [selectedCity?.id]);

    const submitPost = async () => {
        if (uploading) return;

        if (!ratingCompleted || !pendingRatingUpdates || !selectedCity || !imageURIs || imageURIs.length === 0) {
            console.log("Submit blocked: rating not completed or missing info");
            return;
        }

        try {
            setUploading(true);

            // Upload images to S3
            const allUploadUrls: string[] = [];
            for (const uri of imageURIs) {
                const filename = uri.split("/").pop();
                const response = await fetch(
                    `https://adsorm74va.execute-api.us-east-1.amazonaws.com/prod/upload-url?filename=${filename}`
                );
                const data = await response.json();
                const { uploadUrl, fileUrl } = data;

                const image = await fetch(uri);
                const blob = await image.blob();
                await fetch(uploadUrl, { method: "PUT", body: blob });

                allUploadUrls.push(fileUrl);
            }

            // Create a new post in the `posts` collection
            const postRef = await addDoc(collection(FIREBASE_DB, "posts"), {
                urls: allUploadUrls,
                uploader: userName,
                uid: userId,
                city: {
                    id: selectedCity.id,
                    name: selectedCity.name,
                    country: selectedCity.country,
                },
                review: review,
                ratingValue: ratingValue,
                timestamp: Date.now(),
            });

            const postId = postRef.id;

            // Update userPosts: add postId to posts array & apply rating changes
            const uid = getAuth().currentUser?.uid;
            if (!uid) throw new Error("User not authenticated");

            const userRef = doc(FIREBASE_DB, "userPosts", uid);
            const userSnap = await getDoc(userRef);

            // Initialize if document doesn't exist
            if (!userSnap.exists()) {
                await setDoc(userRef, {
                    personalElos: {},
                    comparisonCount: 0,
                    posts: [],
                });
            }

            // Prepare updates
            const updates: any = { posts: arrayUnion(postId) }; // Helper for appending to array

            // Apply personalElos and comparisonCount updates from rating
            if (pendingRatingUpdates.personalElos) {
                for (const [cityId, elo] of Object.entries(pendingRatingUpdates.personalElos)) {
                    updates[`personalElos.${cityId}`] = elo;
                }
            }

            if (pendingRatingUpdates.comparisonIncrement) {
                updates.comparisonCount = increment(pendingRatingUpdates.comparisonIncrement);
            }

            await updateDoc(userRef, updates);

            // Update global Elos
            if (pendingRatingUpdates.globalElos) {
                for (const [cityId, elo] of Object.entries(pendingRatingUpdates.globalElos)) {
                    const cityRef = doc(FIREBASE_DB, "allCities", cityId);
                    await updateDoc(cityRef, {
                        global_Elo: elo,
                        comparison_count: increment(pendingRatingUpdates.comparisonIncrement),
                    });
                }
            }

            // Cleanup local state
            setUploading(false);
            resetRatingState();
            setFeedback(null);
            setRatingCompleted(false);
            setPendingRatingUpdates(null);
            setReview("");
            navigation.goBack();

        } catch (err) {
            console.error("Submit post failed:", err);
            alert("Failed to submit post. Please try again.");
            setUploading(false);
        }
    };

    useEffect(() => {
        if (!feedBack || !selectedCity || ratingStarted) return;

        try {
            const run = async () => {
                setRatingStarted(true);
                setRatingCompleted(false);
                
                console.log("Starting rating");

                const res = await fetch("https://capstone-team-generated-group30-project.onrender.com/rate-city", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        user_id: getAuth().currentUser?.uid,
                        city_id: selectedCity.id,
                        feedback: feedBack,
                    }),
                });

                const data = await res.json();
                console.log("data");
                console.log(data);

                if (data.status === "compare") {
                    setComparison({
                        new_city: data.new_city,
                        existing_city: data.existing_city,
                    });
                } else if (data.status === "done") {
                    setPendingRatingUpdates(data); // Locally stores updates
                    setRatingValue(data.ratingValue);
                    setRatingCompleted(true); // DO NOT reset
                }
            };

            run();
        } catch (err) {
            console.error("Rating failed", err);
            resetRatingState();
        }
    }, [feedBack, selectedCity]);

    const submitComparison = async (preferred: "new" | "existing") => {
        const uid = getAuth().currentUser?.uid;
        if (!uid) return;

        try {
            const res = await fetch("https://capstone-team-generated-group30-project.onrender.com/compare-cities", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                user_id: uid,
                preferred,
                }),
            });

            const data = await res.json();

            if (data.status === "compare") {
                setComparison({
                    new_city: data.new_city,
                    existing_city: data.existing_city,
                });
            } else {
                setPendingRatingUpdates(data); // Locally store updates
                setRatingValue(data.ratingValue);
                setComparison(null);
                setRatingCompleted(true); // Mark finished but DO NOT reset
            }
        } catch (err) {
            console.error("Comparison failed", err);
            resetRatingState();
            setRatingCompleted(true);
        }
    };

    const resetRatingState = () => {
        setComparison(null);
        setRatingStarted(false);
    };

    useEffect(() => {
        if (!ratingStarted) {
            resetRatingState();
            setRatingCompleted(false);
        }
    }, [selectedCity?.id]);

    const renderStars = () => {
        if (ratingValue === null) return null;

        const stars = [];

        // Convert 0–10 rating → 0–5 stars
        const starValue = ratingValue / 2;

        // Round to nearest 0.5
        const rounded = Math.round(starValue * 2) / 2;

            for (let i = 1; i <= 5; i++) {
                let iconName: 
                    | "star"
                    | "star-half-outline"
                    | "star-outline"; // restrict to allowed Ionicons names

                if (i <= Math.floor(rounded)) {
                    iconName = "star"; // full
                }
                else if (i === Math.floor(rounded) + 1 && rounded % 1 === 0.5) {
                    iconName = "star-half-outline"; // half
                }
                else {
                    iconName = "star-outline"; // empty
                }

                stars.push(
                    <Ionicons
                        key={i}
                        name={iconName}
                        size={36}
                        color="#FFD700"
                        style={{ marginHorizontal: 2 }}
                    />
                );
            }

        return (
            <View style={createPostStyles.starContainer}>
                {stars}
            </View>
        );
    };

    const findMatchingCity = (text: string): City | null => {
        const normalized = text.trim().toLowerCase();

        return (
            cities.find(
                (city) =>
                    `${city.name}, ${city.country}`.toLowerCase() === normalized
            ) || null
        );
    };



    return (
        <SafeAreaView style={styles.safeArea} 
            onTouchStart={() => {
                if (!dropdownOpen) {
                    Keyboard.dismiss();
                }
            }}
        >
            {/* Top-left back icon*/}
            <View style={styles.topLeftIcon}>
                <Pressable onPress={() => navigation.goBack()}>
                <GlassView style={styles.glassButton}>
                    <Ionicons name="return-up-back-outline" size={26} color="#000" />
                </GlassView>
                </Pressable>
            </View>
            {/* Top-right save icon*/}
            {ratingCompleted && (
                <View style={styles.topRightIcon}>
                    <Pressable disabled={uploading}  onPress={() => submitPost()}>
                    <GlassView style={styles.glassButton}>
                        <Ionicons name="checkmark-outline" size={26} color="#000" />
                    </GlassView>
                    </Pressable>
                </View>
            )}

            <View style={createPostStyles.homeContainer}>
                <Text variant="headlineLarge" style={createPostStyles.title}>
                    New Post
                </Text>

                {imageURIs && imageURIs.length > 0 && (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={createPostStyles.imageRow}
                >
                    {imageURIs.map((uri, index) => (
                    <Image
                        key={`${uri}-${index}`}
                        source={{ uri }}
                        style={createPostStyles.imagePreview}
                    />
                    ))}
                </ScrollView>
                )}

                {/* City search */}
                <TextInput
                    placeholder="Location"
                    value={searchQuery}
                    onChangeText={(text) => {
                        setSearchQuery(text);
                        setDropdownOpen(true);

                        // Check if typed text matches a real city
                        const match = findMatchingCity(text);
                        setSelectedCity(match);
                    }}
                    onBlur={() => {
                        // Final validation when user leaves the field
                        const match = findMatchingCity(searchQuery);
                        setSelectedCity(match);
                    }}
                    
                    style={createPostStyles.input}
                    mode="outlined"
                    underlineColor="transparent"
                    activeUnderlineColor="transparent"
                    caretHidden={false}
                    selectionColor="#000"
                    outlineColor="#000"
                    theme={inputTheme}
                    left={
                        <TextInput.Icon
                        icon="map-marker-outline"
                        color="#000"
                        />
                    }
                    editable={!ratingStarted && !ratingCompleted}
                />

                {dropdownOpen && searchQuery.length > 0 && (
                    <View style={createPostStyles.dropdown}>
                    <ScrollView keyboardShouldPersistTaps="handled">
                        {cities
                        .filter((city) =>
                            `${city.name}, ${city.country}`
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase())
                        )
                        .map((city) => (
                            <Pressable
                            key={city.id}
                            style={createPostStyles.dropdownItem}
                            onPress={() => {
                                setSelectedCity(city);
                                setSearchQuery(`${city.name}, ${city.country}`);
                                setDropdownOpen(false);
                            }}
                            >
                            <Text>
                                {city.name}, {city.country}
                            </Text>
                            </Pressable>
                        ))}
                    </ScrollView>
                    </View>
                )}

                <TextInput
                    placeholder="Write your review..."
                    value={review}
                    onChangeText={setReview}
                    multiline
                    numberOfLines={4}
                    style={createPostStyles.reviewInput}
                    mode="outlined"
                    underlineColor="transparent"
                    activeUnderlineColor="transparent"
                    caretHidden={false}
                    selectionColor="#000"
                    outlineColor="#000"
                    theme={{...inputTheme, roundness: 20}}
                />

                {selectedCity &&(
                    <View style={createPostStyles.feedbackLayout}>
                        <Text variant="headlineSmall" style={createPostStyles.feedbackQuestionHeader}> 
                            How did you like the city? 
                        </Text>

                        <View style={createPostStyles.iconsLayout}>
                            <Pressable disabled={ratingStarted} onPress={() => setFeedback("LIKE")}>
                                <Entypo name="emoji-happy" size={30} color={feedBack === "LIKE" ? "#0f0" : "#000"} />
                            </Pressable>
                            <Pressable disabled={ratingStarted} onPress={() => setFeedback("NEUTRAL")}>
                                <Entypo name="emoji-neutral" size={30} color={feedBack === "NEUTRAL" ? "#ffa500" : "#000"} />
                            </Pressable>
                            <Pressable disabled={ratingStarted} onPress={() => setFeedback("DISLIKE")}>
                                <Entypo name="emoji-sad" size={30} color={feedBack === "DISLIKE" ? "#f00" : "#000"} />
                            </Pressable>
                        </View>
                    </View>
                )}

                {comparison && comparisonImages.new != null && comparisonImages.existing != null && (
                    <>
                        <Text variant="headlineSmall" style={createPostStyles.comparisonQuestionHeader}>
                            Which city do you prefer?
                        </Text>
                        
                        {/* Display once images are fetched from API */}
                        <View style={createPostStyles.imageComparisonContainer}>

                            {/* New City */}
                            <Pressable
                                style={createPostStyles.imageCard}
                                onPress={() => submitComparison("new")}
                            >
                                {comparisonImages.new && (
                                    <Image
                                        source={{ uri: comparisonImages.new }}
                                        style={createPostStyles.comparisonImage}
                                    />
                                )}
                                
                                <View style={createPostStyles.imageCenterOverlay}>
                                    <Text style={createPostStyles.imageText}>
                                        {comparison.new_city.city_name},{"\n"}
                                        {comparison.new_city.country_name}
                                    </Text>
                                </View>
                            </Pressable>

                            {/* VS Text in between */}
                            <View style={createPostStyles.vsContainer}>
                                <Text variant="headlineSmall" style={createPostStyles.vsText}>VS</Text>
                            </View>

                            {/* Existing City */}
                            <Pressable
                                style={createPostStyles.imageCard}
                                onPress={() => submitComparison("existing")}
                            >
                                {comparisonImages.existing && (
                                    <Image
                                        source={{ uri: comparisonImages.existing }}
                                        style={createPostStyles.comparisonImage}
                                    />
                                )}
                                
                                <View style={createPostStyles.imageCenterOverlay}>
                                    <Text style={createPostStyles.imageText}>
                                        {comparison.existing_city.city_name},{"\n"}
                                        {comparison.existing_city.country_name}
                                    </Text>
                                </View>
                            </Pressable>
                        </View>
                    </>
                )}

                {ratingCompleted && ratingValue !== null && ratingValue !== undefined &&(
                    <View style={createPostStyles.ratingResultContainer}>

                        <Text style={createPostStyles.ratingResultNumber}>
                            {"City Rating:"} {ratingValue.toFixed(1)} / 10.0
                        </Text>

                        {renderStars()}

                    </View>
                )}
            </View>

            {uploading && (
            <View style={createPostStyles.uploadOverlay}>
                <PenguinLoader textColor="white" text="Uploading your post.." />
            </View>
        )}
        </SafeAreaView>
      );

}

export default CreatePost;