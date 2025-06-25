export type FilterType = 'none' | 'blackwhite' | 'sepia' | 'vintage' | 'face';

// Filter matrix values for different effects
export const filterMatrices = {
  blackwhite: [
    0.2126, 0.7152, 0.0722, 0, 0,
    0.2126, 0.7152, 0.0722, 0, 0,
    0.2126, 0.7152, 0.0722, 0, 0,
    0, 0, 0, 1, 0
  ],
  sepia: [
    0.393, 0.769, 0.189, 0, 0,
    0.349, 0.686, 0.168, 0, 0,
    0.272, 0.534, 0.131, 0, 0,
    0, 0, 0, 1, 0
  ],
  vintage: [
    0.9, 0.5, 0.1, 0, 0,
    0.3, 0.8, 0.1, 0, 0,
    0.2, 0.3, 0.5, 0, 0,
    0, 0, 0, 1, 0
  ]
};

// Get the color matrix for a filter type
export const getFilterMatrix = (filterType: FilterType): number[] | null => {
  switch (filterType) {
    case 'blackwhite':
      return filterMatrices.blackwhite;
    case 'sepia':
      return filterMatrices.sepia;
    case 'vintage':
      return filterMatrices.vintage;
    default:
      return null;
  }
};

// Filter preview colors for UI (since we can't do real-time processing)
export const getFilterPreviewStyle = (filterType: FilterType) => {
  switch (filterType) {
    case 'blackwhite':
      return {
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        mixBlendMode: 'color',
      };
    case 'sepia':
      return {
        backgroundColor: 'rgba(112, 66, 20, 0.2)',
        mixBlendMode: 'overlay',
      };
    case 'vintage':
      return {
        backgroundColor: 'rgba(150, 100, 50, 0.15)',
        mixBlendMode: 'multiply',
      };
    case 'face':
      return {};
    default:
      return {};
  }
};

// Helper function to get filter display name
export const getFilterName = (filterType: FilterType): string => {
  switch (filterType) {
    case 'blackwhite':
      return 'B&W';
    case 'sepia':
      return 'Sepia';
    case 'vintage':
      return 'Vintage';
    case 'face':
      return 'Face';
    default:
      return 'None';
  }
};