import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Link } from 'expo-router';
import { Search } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Movie {
  imdbID: string;
  Title: string;
  Year: string;
  Poster: string;
}

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const searchMovies = useCallback(async (searchQuery: string, pageNum: number) => {
    if (!searchQuery.trim()) {
      setMovies([]);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        `https://www.omdbapi.com/?apikey=${process.env.EXPO_PUBLIC_OMDB_API_KEY}&s=${encodeURIComponent(searchQuery)}&page=${pageNum}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch movies');
      }

      const data = await response.json();

      if (data.Response === 'True') {
        if (pageNum === 1) {
          setMovies(data.Search);
        } else {
          setMovies((prev) => [...prev, ...data.Search]);
        }
        setHasMore(data.totalResults > pageNum * 10);
      } else {
        if (pageNum === 1) {
          setMovies([]);
        }
        setHasMore(false);
        if (data.Error) {
          setError(data.Error);
        }
      }
    } catch (error) {
      setError('Failed to fetch movies. Please try again.');
      console.error('Error fetching movies:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = useCallback(() => {
    setPage(1);
    setMovies([]);
    searchMovies(query, 1);
  }, [query, searchMovies]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      searchMovies(query, nextPage);
    }
  }, [loading, hasMore, page, query, searchMovies]);

  const renderMovie = ({ item }: { item: Movie }) => (
    <Link href={`/movie/${item.imdbID}`} asChild>
      <TouchableOpacity style={styles.movieCard}>
        <Image
          source={{
            uri: item.Poster !== 'N/A' ? item.Poster : 'https://via.placeholder.com/300x450',
          }}
          style={styles.poster}
        />
        <View style={styles.movieInfo}>
          <Text style={styles.title} numberOfLines={2}>
            {item.Title}
          </Text>
          <Text style={styles.year}>{item.Year}</Text>
        </View>
      </TouchableOpacity>
    </Link>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search movies..."
          placeholderTextColor="#666"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Search color="#fff" size={24} />
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={movies}
        renderItem={renderMovie}
        keyExtractor={(item) => item.imdbID}
        numColumns={2}
        contentContainerStyle={styles.movieList}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          !loading && !error && query ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No movies found</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          loading ? (
            <ActivityIndicator size="large" color="#e21221" style={styles.loader} />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    height: 48,
    backgroundColor: '#1a1a1a',
    borderRadius: 24,
    paddingHorizontal: 20,
    color: '#fff',
    fontSize: 16,
  },
  searchButton: {
    width: 48,
    height: 48,
    backgroundColor: '#e21221',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  movieList: {
    padding: 8,
  },
  movieCard: {
    flex: 1,
    margin: 8,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
  },
  poster: {
    width: '100%',
    height: 225,
    resizeMode: 'cover',
  },
  movieInfo: {
    padding: 12,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  year: {
    color: '#888',
    fontSize: 14,
  },
  loader: {
    marginVertical: 20,
  },
  errorContainer: {
    padding: 16,
    backgroundColor: '#ff000020',
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#ff0000',
    textAlign: 'center',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#888',
    fontSize: 16,
  },
});