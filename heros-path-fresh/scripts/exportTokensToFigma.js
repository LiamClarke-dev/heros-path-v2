const fs = require('fs');
const path = require('path');

// Import theme from relative path
const { getTheme, THEME_TYPES, Spacing, Typography, Layout, Shadows } = require('../styles/theme');

function convertThemeToTokens(themeName, themeData) {
  const tokens = {
    colors: {},
    spacing: {},
    typography: {},
    effects: {}
  };

  // Convert colors - handle both hex and rgba values
  Object.entries(themeData).forEach(([key, value]) => {
    if (typeof value === 'string' && (
      value.startsWith('#') || 
      value.startsWith('rgb') || 
      value.startsWith('rgba') ||
      value.toLowerCase().includes('transparent')
    )) {
      tokens.colors[key] = {
        value: value,
        type: "color",
        description: `${key} color for ${themeName} theme`
      };
    }
  });

  return tokens;
}

function convertSpacingToTokens() {
  const tokens = {};
  
  Object.entries(Spacing).forEach(([key, value]) => {
    tokens[key] = {
      value: `${value}px`,
      type: "dimension",
      description: `Spacing scale ${key}`
    };
  });

  return tokens;
}

function convertTypographyToTokens() {
  const tokens = {};
  
  Object.entries(Typography).forEach(([key, value]) => {
    if (key === 'bold') return; // Skip utility key
    
    tokens[key] = {
      value: {
        fontFamily: value.fontFamily || "System",
        fontSize: `${value.fontSize}px`,
        fontWeight: value.fontWeight.toString(),
        lineHeight: value.lineHeight || "auto"
      },
      type: "typography",
      description: `Typography style for ${key}`
    };
  });

  return tokens;
}

function convertLayoutToTokens() {
  const tokens = {};
  
  Object.entries(Layout).forEach(([key, value]) => {
    tokens[key] = {
      value: `${value}px`,
      type: "dimension",
      description: `Layout constant ${key}`
    };
  });

  return tokens;
}

function convertShadowsToTokens() {
  const tokens = {};
  
  Object.entries(Shadows).forEach(([key, shadowObj]) => {
    tokens[key] = {
      value: {
        x: shadowObj.shadowOffset?.width || 0,
        y: shadowObj.shadowOffset?.height || 0,
        blur: shadowObj.shadowRadius || 0,
        spread: 0,
        color: shadowObj.shadowColor || "#000000",
        type: "dropShadow"
      },
      type: "shadow",
      description: `Shadow style ${key}`
    };
  });

  return tokens;
}

function exportAllThemes() {
  console.log('🎨 Exporting Hero\'s Path Design System to Figma...\n');
  
  const allTokens = {};
  
  // Export all three themes
  console.log('📱 Exporting theme colors...');
  Object.values(THEME_TYPES).forEach(themeType => {
    const theme = getTheme(themeType);
    const tokens = convertThemeToTokens(themeType, theme);
    allTokens[`${themeType}-theme`] = tokens.colors;
    console.log(`  ✓ ${themeType} theme (${Object.keys(tokens.colors).length} colors)`);
  });

  // Add global design tokens
  console.log('\n📏 Exporting spacing tokens...');
  allTokens.spacing = convertSpacingToTokens();
  console.log(`  ✓ Spacing scale (${Object.keys(allTokens.spacing).length} tokens)`);

  console.log('\n✍️ Exporting typography tokens...');
  allTokens.typography = convertTypographyToTokens();
  console.log(`  ✓ Typography styles (${Object.keys(allTokens.typography).length} tokens)`);

  console.log('\n📐 Exporting layout tokens...');
  allTokens.layout = convertLayoutToTokens();
  console.log(`  ✓ Layout constants (${Object.keys(allTokens.layout).length} tokens)`);

  console.log('\n🌫️ Exporting shadow tokens...');
  allTokens.shadows = convertShadowsToTokens();
  console.log(`  ✓ Shadow styles (${Object.keys(allTokens.shadows).length} tokens)`);

  // Create the final token structure compatible with Token Studio
  const tokenStudioFormat = {
    "heros-path": {
      ...allTokens
    }
  };

  // Ensure scripts directory exists
  const scriptsDir = path.dirname(__filename);
  const outputPath = path.join(scriptsDir, '..', 'figma-design-tokens.json');
  
  fs.writeFileSync(outputPath, JSON.stringify(tokenStudioFormat, null, 2));
  
  console.log('\n🎉 Design tokens successfully exported!');
  console.log(`📁 File location: ${outputPath}`);
  console.log('\n📋 Next steps:');
  console.log('1. Install "Tokens Studio for Figma" plugin in Figma');
  console.log('2. Create a new Figma file for your design system');
  console.log('3. Open Token Studio plugin and import the generated JSON file');
  console.log('4. Apply tokens to create Figma styles and variables');
  
  // Create a summary
  const summary = {
    totalTokens: Object.values(allTokens).reduce((acc, category) => acc + Object.keys(category).length, 0),
    themes: Object.values(THEME_TYPES).length,
    categories: Object.keys(allTokens).length,
    exportDate: new Date().toISOString(),
    components: [
      'AppButton', 'Card', 'Divider', 'ListItem', 'SectionHeader',
      'ZeldaButton', 'ZeldaToggle', 'PingButton', 'PingAnimation'
    ]
  };

  console.log(`\n📊 Export Summary:`);
  console.log(`   • Total tokens: ${summary.totalTokens}`);
  console.log(`   • Themes: ${summary.themes}`);
  console.log(`   • Token categories: ${summary.categories}`);
  console.log(`   • Components ready for design: ${summary.components.length}`);
}

// Run the export
exportAllThemes();