import React from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions 
} from 'react-native';
import { FilterType, getFilterName } from '../utils/filters';

interface FilterCarouselProps {
  selectedFilter: FilterType;
  onFilterSelect: (filter: FilterType) => void;
}

const filters: FilterType[] = ['none', 'blackwhite', 'sepia', 'vintage', 'face'];

export default function FilterCarousel({ selectedFilter, onFilterSelect }: FilterCarouselProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterItem,
              selectedFilter === filter && styles.filterItemSelected
            ]}
            onPress={() => onFilterSelect(filter)}
          >
            <View style={[styles.filterPreview, getFilterPreviewStyle(filter)]} />
            <Text style={[
              styles.filterName,
              selectedFilter === filter && styles.filterNameSelected
            ]}>
              {getFilterName(filter)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// Get filter preview style
const getFilterPreviewStyle = (filter: FilterType) => {
  switch (filter) {
    case 'blackwhite':
      return styles.filterPreviewBW;
    case 'sepia':
      return styles.filterPreviewSepia;
    case 'vintage':
      return styles.filterPreviewVintage;
    case 'face':
      return styles.filterPreviewFace;
    default:
      return styles.filterPreviewNone;
  }
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 140,
    left: 0,
    right: 0,
    height: 100,
  },
  scrollContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  filterItem: {
    alignItems: 'center',
    marginHorizontal: 10,
  },
  filterItemSelected: {
    transform: [{ scale: 1.1 }],
  },
  filterPreview: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 5,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  filterPreviewNone: {
    backgroundColor: '#E0E0E0',
  },
  filterPreviewBW: {
    backgroundColor: '#555555',
  },
  filterPreviewSepia: {
    backgroundColor: '#8B6914',
  },
  filterPreviewVintage: {
    backgroundColor: '#A0522D',
  },
  filterPreviewFace: {
    backgroundColor: '#FFB6C1',
  },
  filterName: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  filterNameSelected: {
    color: '#FFFC00',
  },
});