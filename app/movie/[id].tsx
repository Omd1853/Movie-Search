import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Heart, ArrowLeft, Star } from 'lucide-react-native';

interface MovieDetails {
  Title: string;
  Year: string;
  Rated: string;
  Runtime: string;
  Genre: string;
  Director: string;
  Actors: string;
  Plot: string;
  Poster: string;
  imdbRating: string;
  imdbID: string;
}

export default function MovieScreen() {
  const { id } = useLocalSearchParams();
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        const response = await fetch(
          `https://www.omdbapi.com/?apikey=${process.env.EXPO_PUBLIC_OMDB_API_KEY}&i=${id}&plot=full`
        );
        const data = await response.json();
        setMovie(data);
        checkIfFavorite(data.imdbID);
      } catch (error) {
        console.error('Error fetching movie details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [id]);

  const checkIfFavorite = async (movieId: string) => {
    try {
      const storedFavorites = await AsyncStorage.getItem('favorites');
      if (storedFavorites) {
        const favorites = JSON.parse(storedFavorites);
        setIsFavorite(favorites.some((fav: MovieDetails) => fav.imdbID === movieId));
      }
    } catch (error) {
      console.error('Error checking favorites:', error);
    }
  };

  const toggleFavorite = useCallback(async () => {
    if (!movie) return;

    try {
      const storedFavorites = await AsyncStorage.getItem('favorites');
      let favorites = storedFavorites ? JSON.parse(storedFavorites) : [];

      if (isFavorite) {
        favorites = favorites.filter((fav: MovieDetails) => fav.imdbID !== movie.imdbID);
      } else {
        favorites.push({
          imdbID: movie.imdbID,
          Title: movie.Title,
          Year: movie.Year,
          Poster: movie.Poster,
        });
      }

      await AsyncStorage.setItem('favorites', JSON.stringify(favorites));
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Error updating favorites:', error);
    }
  }, [movie, isFavorite]);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#e21221" />
      </View>
    );
  }

  if (!movie) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Movie not found</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerStyle: {
            backgroundColor: '#000',
          },
          headerTintColor: '#fff',
          headerTitle: '',
          headerLeft: () => (
            <TouchableOpacity style={styles.headerButton}>
              <ArrowLeft color="#fff" size={24} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity style={styles.headerButton} onPress={toggleFavorite}>
              <Heart
                color={isFavorite ? '#e21221' : '#fff'}
                fill={isFavorite ? '#e21221' : 'none'}
                size={24}
              />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.container}>
        <Image
          source={{
            uri: movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/300x450',
          }}
          style={styles.poster}
        />
        <View style={styles.content}>
          <Text style={styles.title}>{movie.Title}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.year}>{movie.Year}</Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.runtime}>{movie.Runtime}</Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.rated}>{movie.Rated}</Text>
          </View>

          <View style={styles.ratingContainer}>
            <Star color="#FFD700" fill="#FFD700" size={20} />
            <Text style={styles.rating}>{movie.imdbRating}/10</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Genre</Text>
            <Text style={styles.sectionText}>{movie.Genre}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Plot</Text>
            <Text style={styles.plot}>{movie.Plot}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Director</Text>
            <Text style={styles.sectionText}>{movie.Director}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cast</Text>
            <Text style={styles.sectionText}>{movie.Actors}</Text>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
  },
  poster: {
    width: '100%',
    height: 450,
    resizeMode: 'cover',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  year: {
    color: '#888',
    fontSize: 16,
  },
  dot: {
    color: '#888',
    marginHorizontal: 8,
  },
  runtime: {
    color: '#888',
    fontSize: 16,
  },
  rated: {
    color: '#888',
    fontSize: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  rating: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#888',
    fontSize: 16,
    marginBottom: 8,
  },
  sectionText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
  },
  plot: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
  },
  errorText: {
    color: '#888',
    fontSize: 18,
  },
});