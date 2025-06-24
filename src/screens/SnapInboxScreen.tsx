import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { getDb } from '../services/firebase';
import { Snap } from '../types';
import { RootStackParamList } from '../Navigation';
import { useAuth } from '../contexts/AuthContext';

type SnapInboxNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SnapInbox'>;

interface SnapWithId extends Snap {
  id: string;
}

export default function SnapInboxScreen() {
  const navigation = useNavigation<SnapInboxNavigationProp>();
  const { username } = useAuth();
  const [snaps, setSnaps] = useState<SnapWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSnaps = () => {
    const db = getDb();

    if (!username) {
      setLoading(false);
      return;
    }

    // Query for snaps where user is in recipients and snap hasn't expired
    const snapsQuery = query(
      collection(db, 'snaps'),
      where('recipients', 'array-contains', username),
      where('expiresAt', '>', Timestamp.now()),
      orderBy('createdAt', 'desc')
    );

    // Real-time listener
    const unsubscribe = onSnapshot(snapsQuery, (snapshot) => {
      const snapsList: SnapWithId[] = [];
      snapshot.forEach((doc) => {
        snapsList.push({
          id: doc.id,
          ...doc.data() as Snap
        });
      });

      // Filter out already viewed snaps
      const unviewedSnaps = snapsList.filter(snap => 
        !snap.viewedBy.some(view => view.uid === userId)
      );

      setSnaps(unviewedSnaps);
      setLoading(false);
      setRefreshing(false);
    }, (error) => {
      console.error('Error loading snaps:', error);
      setLoading(false);
      setRefreshing(false);
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  };

  useEffect(() => {
    const unsubscribe = loadSnaps();
    return unsubscribe;
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadSnaps();
  };

  const renderSnapItem = ({ item }: { item: SnapWithId }) => {
    const isFromSelf = item.creatorId === getAuth().currentUser?.uid;
    
    return (
      <TouchableOpacity
        style={styles.snapItem}
        onPress={() => navigation.navigate('SnapView', { snapId: item.id })}
      >
        <View style={styles.snapInfo}>
          <Text style={styles.snapSender}>
            {isFromSelf ? 'Me (Test)' : 'Unknown'}
          </Text>
          <Text style={styles.snapType}>
            {item.mediaType === 'photo' ? '📷' : '🎥'} {item.mediaType}
          </Text>
        </View>
        <Text style={styles.tapToView}>Tap to view</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FFFC00" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Snap Inbox</Text>
      
      {snaps.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No new snaps</Text>
          <Text style={styles.emptySubtext}>
            Send yourself a snap from the camera!
          </Text>
        </View>
      ) : (
        <FlatList
          data={snaps}
          keyExtractor={(item) => item.id}
          renderItem={renderSnapItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FFFC00"
            />
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  title: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 60,
    marginBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    color: '#FFF',
    fontSize: 18,
    marginBottom: 10,
  },
  emptySubtext: {
    color: '#AAA',
    fontSize: 14,
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  snapItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  snapInfo: {
    flex: 1,
  },
  snapSender: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  snapType: {
    color: '#AAA',
    fontSize: 14,
  },
  tapToView: {
    color: '#FFFC00',
    fontSize: 14,
    fontWeight: '600',
  },
});