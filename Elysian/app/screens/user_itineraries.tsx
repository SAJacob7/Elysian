/* 
File: user_itineraries.tsx
Function: This is the user's itineraries subtab screen component for the Profile page. 
*/
import React, { useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, ImageBackground, TouchableOpacity, Pressable, Image, TextInput } from "react-native";
import { FIREBASE_AUTH, FIREBASE_DB } from "../../FirebaseConfig";
import { arrayUnion, collection, doc, getDocs, onSnapshot, query, updateDoc, where } from "firebase/firestore";
import { styles } from "./app_styles.styles";
import { Button } from "react-native-paper";
import { itinerarySubTabStyles } from "./user_itineraries.styles";
import { Ionicons, } from "@expo/vector-icons";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";





export type Itinerary = {
    id: string;
    activities: Activity[];

    city: string;
    country: string;
    imageUrl?: string | null;
    ownerId: string;
    sharedWith: string[];
};
export type Activity = {
    name: string;
    likes: string[];
};

type UserItinerariesProps = {
    onOpenItinerary: (itin: Itinerary) => void;
    onOpenShareModal: (itin: Itinerary) => void;
};



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


const UserItineraries = ({ onOpenItinerary, onOpenShareModal }: UserItinerariesProps) => {
    const [itineraries, setItineraries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [unsplashImageUrl, setUnsplashImageUrl] = useState<{ [key: string]: string | null }>({});



    const doubleTap = useRef<number | null>(null);

    useEffect(() => {
        const currentUser = FIREBASE_AUTH.currentUser;
        if (!currentUser) return;

        // Query itineraries the user owns
        const qOwned = query(
            collection(FIREBASE_DB, "itineraries"),
            where("ownerId", "==", currentUser.uid)
        );

        // Query itineraries shared with the user
        const qShared = query(
            collection(FIREBASE_DB, "itineraries"),
            where("sharedWith", "array-contains", currentUser.uid)
        );

        // Listen to both queries in real time
        const unsubOwned = onSnapshot(qOwned, async (ownedSnap) => {
            const ownedData = ownedSnap.docs.map((doc) => ({
                id: doc.id,
                ...(doc.data() as any),
            }));

            // Fetch images for owned itineraries
            const imageGet = ownedData.map(async (itin) => {
                const img = await fetchUnsplashImage(itin.city, itin.country);
                return { id: itin.id, img };
            });

            const result_images = await Promise.all(imageGet);

            const imageMap: { [key: string]: string | null } = {};
            result_images.forEach((r) => {
                imageMap[r.id] = r.img;
            });

            setUnsplashImageUrl((prev) => ({ ...prev, ...imageMap }));
            setItineraries((prev) => {
                const sharedOnly = prev.filter((i) => i.ownerId !== currentUser.uid);
                return [...ownedData, ...sharedOnly];
            });
        });

        const unsubShared = onSnapshot(qShared, async (sharedSnap) => {
            const sharedData = sharedSnap.docs.map((doc) => ({
                id: doc.id,
                ...(doc.data() as any),
            }));

            // Fetch images for shared itineraries
            const imageGet = sharedData.map(async (itin) => {
                const img = await fetchUnsplashImage(itin.city, itin.country);
                return { id: itin.id, img };
            });

            const result_images = await Promise.all(imageGet);

            const imageMap: { [key: string]: string | null } = {};
            result_images.forEach((r) => {
                imageMap[r.id] = r.img;
            });

            setUnsplashImageUrl((prev) => ({ ...prev, ...imageMap }));
            setItineraries((prev) => {
                const ownedOnly = prev.filter((i) => i.ownerId === currentUser.uid);
                return [...ownedOnly, ...sharedData];
            });
        });

        setLoading(false);

        // Cleanup listeners on unmount
        return () => {
            unsubOwned();
            unsubShared();
        };
    }, []);





    if (loading) {
        return (
            <View style={itinerarySubTabStyles.itineraryLoading}>
                <ActivityIndicator size="large" />
            </View>
        );
    }
    // Check that user has an itinerary.
    if (itineraries.length === 0) {
        return (
            <View style={itinerarySubTabStyles.itineraryEmpty}>
                <Text>No itineraries found.</Text>
            </View>
        );
    }

    return (
        <ScrollView style={{ flex: 1, }}>
            <View
                style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    // justifyContent: "space-between",
                }}
            >
                {itineraries.map((itin) => {
                    const imageUrl = unsplashImageUrl[itin.id];

                    return (
                        <View
                            key={itin.id}
                            style={itinerarySubTabStyles.itineraryGrid}
                        >

                            <Pressable
                                onPress={() => {
                                    const now = Date.now();
                                    if (doubleTap.current && now - doubleTap.current < 300) {
                                        onOpenItinerary({
                                            ...itin,
                                            imageUrl: unsplashImageUrl[itin.id] ?? null,
                                        });

                                    }
                                    doubleTap.current = now;
                                }}
                            >
                                <ImageBackground
                                    source={imageUrl ? { uri: imageUrl } : undefined}
                                    style={itinerarySubTabStyles.itineraryCard}
                                >
                                    <TouchableOpacity
                                        style={itinerarySubTabStyles.shareIcon}
                                        onPress={() => onOpenShareModal(itin)}

                                    >

                                        <View style={itinerarySubTabStyles.shareOverlay}>
                                            <View style={itinerarySubTabStyles.shareTag}>
                                                <Ionicons name="person-add" size={17} color="#000" />
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                    <View style={itinerarySubTabStyles.itineraryCardBlurContainer}>
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
                                            <BlurView
                                                intensity={100}
                                                tint="dark"
                                                style={{ flex: 1 }}
                                            />
                                        </MaskedView>
                                        <View style={itinerarySubTabStyles.itineraryCardTextContainer}>
                                            <Text
                                                style={itinerarySubTabStyles.itineraryCityText}
                                            >
                                                {itin.city}, {"\n"}{itin.country}
                                            </Text>
                                        </View>
                                    </View>
                                </ImageBackground>
                            </Pressable>



                        </View>
                    );
                })}
            </View>

        </ScrollView>

    );

};

export default UserItineraries;
