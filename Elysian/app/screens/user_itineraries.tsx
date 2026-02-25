/* 
File: user_itineraries.tsx
Function: This is the user's itineraries subtab screen component for the Profile page. 
*/
import React, { useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, ImageBackground, TouchableOpacity, Pressable, Image } from "react-native";
import { FIREBASE_AUTH, FIREBASE_DB } from "../../FirebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { styles } from "./app_styles.styles";
import { Button } from "react-native-paper";
import { itinerarySubTabStyles } from "./user_itineraries.styles";




export type Itinerary = {
    id: string;
    activities: string[];
    city: string;
    country: string;
    imageUrl?: string | null;
};
type UserItinerariesProps = {
    onOpenItinerary: (itin: Itinerary) => void;
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


const UserItineraries = ({ onOpenItinerary }: UserItinerariesProps) => {
    const [itineraries, setItineraries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [unsplashImageUrl, setUnsplashImageUrl] = useState<{ [key: string]: string | null }>({});


    const doubleTap = useRef<number | null>(null);

    useEffect(() => {
        const fetchItineraries = async () => {
            try {
                const currentUser = FIREBASE_AUTH.currentUser; // Get the current user logged in.
                if (!currentUser) return;

                const itinerariesRef = collection(
                    FIREBASE_DB,
                    "userItineraries",
                    currentUser.uid,
                    "savedItineraries"
                );

                const snapshot = await getDocs(itinerariesRef);

                const data: Itinerary[] = snapshot.docs.map((doc) => { // Created the Itinerary type and store the data in here.
                    const itin_data = doc.data();
                    return {
                        id: doc.id, // Id of the itinerary.
                        activities: itin_data.activities || [], // Activities
                        city: itin_data.city || "", // City
                        country: itin_data.country || "", // Country
                    };
                });
                setItineraries(data);
                // Now, try to get the images of the city, country to display.
                const imageGet = data.map(async (itin) => {
                    const img = await fetchUnsplashImage(itin.city, itin.country);
                    return { id: itin.id, img };
                });
                const result_images = await Promise.all(imageGet);

                // Now, map the images taken from unsplash to the city, country.
                const imageMap: {
                    [key: string]: string | null
                } = {};
                result_images.forEach((r) => {
                    imageMap[r.id] = r.img; // The key is the itinerary ID, the value is the image.
                });
                setUnsplashImageUrl(imageMap);

            } catch (error) {
                console.error("Error fetching itineraries:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchItineraries();
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
                                    <View
                                        style={itinerarySubTabStyles.itineraryTextBackground}
                                    >
                                        <Text
                                            style={itinerarySubTabStyles.itineraryCityText}
                                        >
                                            {itin.city}, {itin.country}
                                        </Text>
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
