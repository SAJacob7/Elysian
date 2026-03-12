import React, { useEffect, useRef, useState } from "react";
import {
  View,
  ScrollView,
  ActivityIndicator,
  Pressable,
  ImageBackground,
  Modal,
  FlatList,
  Image,
  Dimensions,
} from "react-native";
import { Text } from "react-native-paper";
import { FIREBASE_DB } from "../../FirebaseConfig";
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { itinerarySubTabStyles } from "./styles/user_itineraries.styles";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { styles } from "./styles/app_styles.styles";
import { homeStyles } from "./styles/home.styles";
import { profileStyles } from "./styles/profile.styles";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

export type Post = {
  id: string;
  urls: string[];
  uploader: string;
  uid: string;
  city: {
    id: string;
    name: string;
    country: string;
  };
  review: string;
  ratingValue: number;
  timestamp: number;
  likeCount?: number;
};

type UserPostsProps = {
  userId: string;
};

const UserPosts = ({ userId }: UserPostsProps) => {
  const [posts, setPosts] = useState<Post[]>([]); //initializes post as an empty array which is then updated by setPosts
  const [loading, setLoading] = useState(true);
  const [openPost, setOpenPost] = useState<Post | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const doubleTap = useRef<number | null>(null);

  useEffect(() => {
    if (!userId) {
      return;
    }
    const q = query(
      collection(FIREBASE_DB, "posts"),
      where("uid", "==", userId),
      orderBy("timestamp", "desc"),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      // store the function that stops listening into the variable unsubscribe
      const data: Post[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Post, "id">),
      }));
      setPosts(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [userId]);

  const handlePress = (post: Post) => {
    const now = Date.now();
    if (doubleTap.current && now - doubleTap.current < 300) {
      setOpenPost(post);
    }
    doubleTap.current = now;
  };

  if (loading) {
    return (
      <View style={itinerarySubTabStyles.itineraryLoading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (posts.length === 0) {
    return (
      <View style={itinerarySubTabStyles.itineraryEmpty}>
        <Image
          source={require("../../assets/penguin.png")}
          style={profileStyles.emptyPageImage}
          resizeMode="contain"
        />
        <Text variant="bodyLarge" style={itinerarySubTabStyles.emptyText}>
          No Posts Yet
        </Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={{ flex: 1 }}>
        <View style={profileStyles.scrollContainer}>
          {posts.map((post) => {
            const imageUrl = post.urls?.[0];
            return (
              <View key={post.id} style={profileStyles.scrollGrid}>
                <Pressable onPress={() => handlePress(post)}>
                  <ImageBackground
                    source={imageUrl ? { uri: imageUrl } : undefined}
                    style={profileStyles.scrollCard}
                  >
                    <View style={profileStyles.likeOverlay}>
                      <View style={profileStyles.likeTag}>
                        <Text style={profileStyles.likeCountText}>
                          {post.likeCount ?? 0}
                        </Text>
                        <Ionicons
                          name={post.likeCount ? "heart" : "heart-outline"}
                          size={17}
                          color={post.likeCount ? "#EB7D87" : "#000"}
                        />
                      </View>
                    </View>
                    <View style={profileStyles.scrollCardBlurContainer}>
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
                      <View style={profileStyles.cardCityTextContainer}>
                        <Text style={profileStyles.cardCityText}>
                          {post.city?.name}, {"\n"}
                          {post.city?.country}
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
      {openPost && (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={() => setOpenPost(null)}
        >
          <View style={styles.modalDimOverlay}>
            {/* Background press layer */}
            <Pressable
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
              }}
              onPress={() => setOpenPost(null)}
            />

            {/* Modal Content (unchanged styles) */}
            <View style={styles.modalWrapper}>
              <View style={homeStyles.postContainer}>
                {/* IMAGE SECTION */}
                <View style={homeStyles.imageContainer}>
                  {openPost.urls.length === 1 ? (
                    <Image
                      source={{ uri: openPost.urls[0] }}
                      style={homeStyles.cityImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <FlatList
                      data={openPost.urls}
                      horizontal
                      pagingEnabled
                      showsHorizontalScrollIndicator={false}
                      bounces={false}
                      keyExtractor={(uri, index) => uri + index}
                      scrollEventThrottle={16}
                      onScroll={(event) => {
                        const modalWidth = Dimensions.get("window").width * 0.9;
                        const index = Math.round(
                          event.nativeEvent.contentOffset.x / modalWidth,
                        );
                        setCurrentIndex(index);
                      }}
                      renderItem={({ item }) => (
                        <Image
                          source={{ uri: item }}
                          style={homeStyles.cityImage}
                          resizeMode="cover"
                        />
                      )}
                    />
                  )}

                  {/* Blur - only on first image and if city exists */}
                  {currentIndex === 0 && openPost.city && (
                    <View style={homeStyles.postBlurContainer}>
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
                    </View>
                  )}
                  {/* Scroll indicators */}
                  {openPost.urls.length > 1 && (
                    <View style={homeStyles.scrollIndicatorContainer}>
                      {openPost.urls.map((_, i) => (
                        <View
                          key={i}
                          style={[
                            homeStyles.scrollDot,
                            i === currentIndex && homeStyles.activeScrollDot,
                          ]}
                        />
                      ))}
                    </View>
                  )}

                  {/* City overlay */}
                  {currentIndex === 0 && openPost.city && (
                    <View style={homeStyles.cityOverlay}>
                      <Text style={homeStyles.cityFont}>
                        {openPost.city.name}
                      </Text>
                      <View style={homeStyles.pinIcon}>
                        <MaterialCommunityIcons
                          name="map-marker-outline"
                          size={22}
                          color="#f7f7f7"
                        />
                        <Text style={homeStyles.countryFont}>
                          {openPost.city.country}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Rating */}
                  {openPost.ratingValue !== undefined && (
                    <View style={homeStyles.ratingOverlay}>
                      <View style={homeStyles.ratingTag}>
                        <Text style={homeStyles.ratingFont}>
                          {openPost.ratingValue.toFixed(1)}
                        </Text>
                        <MaterialCommunityIcons
                          name="star-face"
                          size={20}
                          color="#000"
                        />
                      </View>
                    </View>
                  )}
                </View>

                {/* CONTENT SECTION (unchanged) */}
                <View style={homeStyles.contentContainer}>
                  <Text style={homeStyles.uploader}>@{openPost.uploader}</Text>

                  <Text style={homeStyles.reviewFont}>{openPost.review}</Text>

                  <Text style={homeStyles.date}>
                    {new Date(openPost.timestamp).toLocaleDateString()}
                  </Text>
                  <View
                    style={[
                      homeStyles.postIcons,
                      { flexDirection: "row", alignItems: "center" },
                    ]}
                  >
                    <Text style={profileStyles.openPostLikeCountText}>
                      {openPost.likeCount ?? 0}
                    </Text>
                    <Ionicons
                      name={openPost.likeCount ? "heart" : "heart-outline"}
                      size={28}
                      color={openPost.likeCount ? "#EB7D87" : "#000"}
                    />
                  </View>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
};

export default UserPosts;
