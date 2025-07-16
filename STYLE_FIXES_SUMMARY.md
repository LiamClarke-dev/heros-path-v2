# Style Fixes Summary - FontWeight Error Resolution

## Issue
`TypeError: Cannot read property 'fontWeight' of undefined, js engine: hermes`

## Root Cause
Several components had styles defined at **module scope** (when the file is first loaded) that referenced theme properties or Typography objects that might be undefined during JavaScript module initialization. This happens because:

1. `StyleSheet.create()` is called immediately when the module loads
2. Theme colors or Typography objects may not be initialized yet
3. Hermes engine throws errors when accessing undefined properties

## Files Fixed

### 1. `components/AnimationDemo.js`
**Problem**: Module-scope `colors` definition and `StyleSheet.create()` referencing theme colors
**Solution**: Moved styles inside the component where theme colors are properly initialized

### 2. `components/PingAnimation.js`
**Problem**: Module-scope `colors` definition and `StyleSheet.create()` referencing theme colors
**Solution**: Moved styles inside the component where theme colors are properly initialized

### 3. `components/PingStats.js`
**Problem**: Module-scope `StyleSheet.create()` that could reference undefined theme colors
**Solution**: Moved styles inside the component where theme colors are properly initialized

### 4. `components/ZeldaButton.js`
**Problem**: Module-scope theme color calculations and `StyleSheet.create()`
**Solution**: Moved both color calculations and styles inside the component

### 5. `screens/DiscoveriesScreen.js`
**Problem**: Direct references to `Typography.body.fontWeight` and `Typography.h1.fontWeight` in styles
**Solution**: Replaced with hardcoded values:
- `Typography.body.fontWeight` → `'600'`
- `Typography.h1.fontWeight` → `'bold'`

### 6. `screens/SavedPlacesScreen.js`
**Problem**: Direct reference to `Typography.h1.fontWeight` in styles
**Solution**: Replaced with `'bold'`

## Best Practices Going Forward

### ✅ DO:
```javascript
const MyComponent = () => {
  const { getCurrentThemeColors } = useTheme();
  const colors = getCurrentThemeColors() || getFallbackTheme();
  
  // Define styles INSIDE the component
  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.background, // ✅ Safe
      fontWeight: 'bold', // ✅ Use hardcoded values
    },
  });
  
  return <View style={styles.container} />;
};
```

### ❌ DON'T:
```javascript
// ❌ Module-scope colors
const colors = getFallbackTheme();

// ❌ Module-scope styles referencing theme
const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background, // ❌ Unsafe
    fontWeight: Typography.h1.fontWeight, // ❌ Can be undefined
  },
});

const MyComponent = () => {
  return <View style={styles.container} />;
};
```

## Key Principles

1. **Always define styles inside components** where theme context is available
2. **Avoid module-scope style definitions** that reference theme properties
3. **Use hardcoded values** for fontWeight instead of Typography references
4. **Use getFallbackTheme()** as a fallback when theme context might be undefined
5. **Test with Hermes engine** to catch undefined property errors early

## Verification

After these fixes, the app should no longer throw the fontWeight undefined error. All styles are now properly contained within component boundaries where theme properties are guaranteed to be available.