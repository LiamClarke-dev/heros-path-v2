# Map Styling System Documentation

## Overview

The Map Styling System provides comprehensive map style selection with visual previews, persistence, and theme integration. It allows users to choose from multiple map styles with rich visual feedback.

## Components

### 1. MapStylePreviewCard
**Location**: `components/ui/MapStylePreviewCard.js`

A card component that displays a map style with visual preview, name, and description.

```javascript
import MapStylePreviewCard from '../components/ui/MapStylePreviewCard';

<MapStylePreviewCard
  styleKey="standard"
  styleConfig={mapStyleConfig}
  isSelected={true}
  onSelect={(styleKey) => handleStyleChange(styleKey)}
  compact={false}
/>
```

**Props**:
- `styleKey`: The map style identifier
- `styleConfig`: Configuration object for the style
- `isSelected`: Whether this style is currently selected
- `onSelect`: Callback function when style is selected
- `compact`: Whether to use compact layout (optional)

### 2. MapStyleVisualPreview
**Location**: `components/ui/MapStyleVisualPreview.js`

Creates visual representations of map styles using geometric shapes and colors.

```javascript
import MapStyleVisualPreview from '../components/ui/MapStyleVisualPreview';

<MapStyleVisualPreview 
  styleKey="adventure" 
  size={60} 
/>
```

**Props**:
- `styleKey`: The map style identifier
- `size`: Size of the preview (default: 60)

### 3. MapStyleSelector
**Location**: `components/ui/MapStyleSelector.js`

A comprehensive selector component that displays all available map styles in a grid.

```javascript
import MapStyleSelector from '../components/ui/MapStyleSelector';

<MapStyleSelector 
  onStyleChange={(styleKey) => console.log('Style changed to:', styleKey)} 
/>
```

**Props**:
- `onStyleChange`: Callback function when style changes (optional)

### 4. MapStyleSelectionScreen
**Location**: `screens/MapStyleSelectionScreen.js`

A dedicated screen for map style selection with navigation.

```javascript
// Add to your navigation stack
<Stack.Screen 
  name="MapStyleSelection" 
  component={MapStyleSelectionScreen} 
/>
```

## Utilities

### MapStylePreviews
**Location**: `utils/MapStylePreviews.js`

Provides preview colors, patterns, and image management for map styles.

```javascript
import { getPreviewColors, getPreviewPattern } from '../utils/MapStylePreviews';

const colors = getPreviewColors('adventure');
const pattern = getPreviewPattern('night');
```

**Functions**:
- `getPreviewImage(styleKey)`: Get preview image for style
- `getPreviewColors(styleKey)`: Get color scheme for style
- `getPreviewPattern(styleKey)`: Get pattern configuration for style
- `hasPreviewImage(styleKey)`: Check if preview image exists
- `generateAllPreviews()`: Generate preview data for all styles

## Integration

### ThemeContext Integration

The map styling system is fully integrated with the existing ThemeContext:

```javascript
import { useTheme } from '../contexts/ThemeContext';

const { 
  currentMapStyle, 
  changeMapStyle, 
  mapStyleConfigs 
} = useTheme();

// Change map style
await changeMapStyle('night');
```

### SettingsScreen Integration

The SettingsScreen has been enhanced with visual map style previews:

```javascript
// The Theme & Map Style section now uses MapStylePreviewCard
// for better visual feedback and user experience
```

## Available Map Styles

1. **Standard** - Classic map view with roads and landmarks
2. **Satellite** - Aerial view with satellite imagery  
3. **Terrain** - Topographic view with elevation details
4. **Night** - Dark theme optimized for low-light conditions
5. **Adventure** - Fantasy-inspired map style for explorers

## Persistence

Map style preferences are automatically persisted using AsyncStorage:

- **Storage Key**: `@user_map_style`
- **Default Style**: `standard`
- **Auto-load**: Preferences are loaded on app startup

## Testing

Use the MapStyleTest component for development testing:

```javascript
import MapStyleTest from '../components/ui/MapStyleTest';

// Add to your development screens for testing
<MapStyleTest />
```

## Customization

### Adding New Map Styles

1. Add the style to `MAP_STYLES` in `styles/theme.js`
2. Add configuration to `MAP_STYLE_CONFIGS`
3. Add preview colors to `PREVIEW_COLORS` in `utils/MapStylePreviews.js`
4. Add visual preview logic to `MapStyleVisualPreview.js`

### Custom Preview Images

Replace placeholder images in `utils/MapStylePreviews.js`:

```javascript
export const PREVIEW_IMAGE_PATHS = {
  standard: require('../assets/map-previews/standard.png'),
  // ... other styles
};
```

## Performance Considerations

- Preview images are loaded lazily
- Visual previews use simple geometric shapes for performance
- Style changes are debounced to prevent rapid switching
- AsyncStorage operations are optimized for minimal blocking

## Accessibility

All components include proper accessibility support:

- Screen reader labels
- Accessibility roles and states
- High contrast support
- Keyboard navigation support

## Requirements Fulfilled

This implementation fulfills all requirements from task 6:

✅ **Create map style definitions for different themes**
- Defined in `styles/theme.js` as `MAP_STYLE_CONFIGS`

✅ **Implement style switching functionality** 
- Implemented in `ThemeContext.js` as `changeMapStyle()`

✅ **Add persistence for user's style preference**
- Implemented using AsyncStorage with key `@user_map_style`

✅ **Create preview images for style selection UI**
- Implemented as `MapStyleVisualPreview` component with geometric representations
- Utility system for managing preview images in `utils/MapStylePreviews.js`

## Future Enhancements

- Add actual screenshot preview images
- Implement style preview animations
- Add custom style creation
- Add style sharing between users
- Add seasonal or location-based style suggestions