# Hero's Path: Exporting Components and Themes to Figma

This guide explains how to export your React Native components, themes, and design system to Figma for design collaboration and maintenance.

## Overview

Hero's Path has a robust component library and theming system that can be exported to Figma using several approaches:

1. **Design Tokens Export** (Recommended)
2. **Storybook + story.to.design Integration**
3. **Manual Documentation with Figma Templates**

## Current Component Inventory

### UI Components
- **AppButton** - Primary button component with variants
- **Card** - Surface component with shadow
- **Divider** - Visual separator
- **ListItem** - List item with styling
- **SectionHeader** - Section title component

### Specialized Components
- **ZeldaButton** - Fantasy-themed button with corner decorations
- **ZeldaToggle** - Themed toggle component
- **PingButton** - Animated interaction button
- **PingAnimation** - Location ping visualization

### Theme System
- **Light Theme** - Clean, modern iOS-style interface
- **Dark Theme** - Battery-efficient dark mode
- **Adventure Theme** - Fantasy-inspired Zelda-like theme

## Method 1: Design Tokens Export (Recommended)

### Step 1: Install Token Studio Plugin
1. Install the "Tokens Studio for Figma" plugin in Figma
2. Create a new Figma file for your design system

### Step 2: Convert Theme to Design Tokens Format

Create a design tokens export script:

```javascript
// scripts/exportTokensToFigma.js
const fs = require('fs');
const { getTheme, THEME_TYPES } = require('../styles/theme');

function convertThemeToTokens(themeName, themeData) {
  const tokens = {
    [`theme-${themeName}`]: {
      colors: {},
      spacing: {},
      typography: {},
      effects: {}
    }
  };

  // Convert colors
  Object.entries(themeData).forEach(([key, value]) => {
    if (typeof value === 'string' && (value.startsWith('#') || value.startsWith('rgb'))) {
      tokens[`theme-${themeName}`].colors[key] = {
        value: value,
        type: "color"
      };
    }
  });

  return tokens;
}

function exportAllThemes() {
  const allTokens = {};
  
  // Export all three themes
  Object.values(THEME_TYPES).forEach(themeType => {
    const theme = getTheme(themeType);
    const tokens = convertThemeToTokens(themeType, theme);
    Object.assign(allTokens, tokens);
  });

  // Add spacing tokens
  allTokens.spacing = {
    xs: { value: "4px", type: "dimension" },
    sm: { value: "8px", type: "dimension" },
    md: { value: "16px", type: "dimension" },
    lg: { value: "24px", type: "dimension" },
    xl: { value: "32px", type: "dimension" },
    xxl: { value: "48px", type: "dimension" }
  };

  // Add typography tokens
  allTokens.typography = {
    h1: { 
      value: {
        fontFamily: "System",
        fontSize: "28px",
        fontWeight: "700",
        lineHeight: "auto"
      }, 
      type: "typography" 
    },
    body: { 
      value: {
        fontFamily: "System",
        fontSize: "16px",
        fontWeight: "400",
        lineHeight: "auto"
      }, 
      type: "typography" 
    }
    // Add more typography tokens as needed
  };

  fs.writeFileSync(
    'figma-design-tokens.json', 
    JSON.stringify(allTokens, null, 2)
  );
  
  console.log('Design tokens exported to figma-design-tokens.json');
}

exportAllThemes();
```

### Step 3: Import Tokens to Figma
1. Run the export script: `node scripts/exportTokensToFigma.js`
2. In Figma, open Token Studio plugin
3. Import the generated `figma-design-tokens.json` file
4. Apply tokens to create your color and typography styles

## Method 2: Storybook + story.to.design Integration

### Step 1: Set Up Storybook

```bash
npx storybook@latest init
```

### Step 2: Create Component Stories

Create stories for each component:

```javascript
// stories/AppButton.stories.js
import React from 'react';
import { AppButton } from '../components/ui/AppButton';
import { ThemeProvider } from '../contexts/ThemeContext';
import { getTheme, THEME_TYPES } from '../styles/theme';

export default {
  title: 'UI/AppButton',
  component: AppButton,
  decorators: [
    (Story, context) => (
      <ThemeProvider>
        <Story {...context} />
      </ThemeProvider>
    ),
  ],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'danger'],
    },
    disabled: {
      control: 'boolean',
    },
  },
};

export const Primary = {
  args: {
    title: 'Primary Button',
    variant: 'primary',
  },
};

export const Secondary = {
  args: {
    title: 'Secondary Button',
    variant: 'secondary',
  },
};

export const Danger = {
  args: {
    title: 'Danger Button',
    variant: 'danger',
  },
};
```

### Step 3: Use story.to.design
1. Install the story.to.design Figma plugin
2. Connect your Storybook URL
3. Select components to import
4. Generate Figma components automatically

## Method 3: Manual Figma Template Creation

### Step 1: Create Component Templates

For each component, create a Figma template with:

1. **Component Definition**: Main component with all variants
2. **Properties Panel**: Define component properties that match your React props
3. **Documentation**: Add descriptions and usage guidelines

### Example: AppButton Template Structure

```
AppButton [Component]
├── Variant=Primary, Size=Default [Variant]
├── Variant=Primary, Size=Small [Variant]
├── Variant=Secondary, Size=Default [Variant]
├── Variant=Secondary, Size=Small [Variant]
├── Variant=Danger, Size=Default [Variant]
└── Variant=Danger, Size=Small [Variant]
```

### Step 2: Create Theme Color Styles

1. Create color styles in Figma for each theme:
   - Light/Primary → #007AFF
   - Light/Secondary → #5856D6
   - Dark/Primary → #0A84FF
   - Adventure/Primary → #4A90E2

### Step 3: Document Component Properties

Create a documentation page with:
- Component API (props and their types)
- Usage examples
- Design guidelines
- Code snippets

## Automation Scripts

### Theme Color Extractor

```javascript
// scripts/extractColorsForFigma.js
const { getTheme, THEME_TYPES } = require('../styles/theme');

function extractColorsToCSS() {
  let css = '';
  
  Object.values(THEME_TYPES).forEach(themeType => {
    const theme = getTheme(themeType);
    css += `/* ${themeType.toUpperCase()} THEME */\n`;
    
    Object.entries(theme).forEach(([key, value]) => {
      if (typeof value === 'string' && (value.startsWith('#') || value.startsWith('rgb'))) {
        css += `--${themeType}-${key}: ${value};\n`;
      }
    });
    
    css += '\n';
  });
  
  return css;
}

console.log(extractColorsToCSS());
```

### Component Documentation Generator

```javascript
// scripts/generateComponentDocs.js
const fs = require('fs');
const path = require('path');

function generateComponentDocumentation() {
  const componentsDir = 'components';
  const components = [];
  
  // Read all component files
  const files = fs.readdirSync(componentsDir, { recursive: true });
  
  files.forEach(file => {
    if (file.endsWith('.js')) {
      const content = fs.readFileSync(path.join(componentsDir, file), 'utf8');
      
      // Extract props from PropTypes or TypeScript
      const componentInfo = {
        name: path.basename(file, '.js'),
        path: file,
        props: extractProps(content),
        description: extractDescription(content)
      };
      
      components.push(componentInfo);
    }
  });
  
  // Generate Figma-friendly documentation
  const documentation = {
    designSystem: {
      name: "Hero's Path Design System",
      version: "1.0.0",
      components: components,
      themes: Object.values(THEME_TYPES),
      spacing: ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'],
      typography: ['h1', 'h2', 'h3', 'h4', 'body', 'caption']
    }
  };
  
  fs.writeFileSync('figma-documentation.json', JSON.stringify(documentation, null, 2));
  console.log('Component documentation exported for Figma');
}

generateComponentDocumentation();
```

## Best Practices

### 1. Naming Conventions
- Use consistent naming between code and Figma
- Follow semantic naming for colors (primary, secondary, etc.)
- Use descriptive component names

### 2. Component Structure
- Mirror React component props in Figma properties
- Create variants for all component states
- Document usage patterns

### 3. Theme Management
- Create separate color libraries for each theme
- Use Figma variables for dynamic theming
- Maintain consistency across themes

### 4. Maintenance
- Set up automated sync processes
- Regular reviews to ensure design-code alignment
- Version control for design assets

## Tools and Resources

### Recommended Figma Plugins
- **Tokens Studio** - For design tokens management
- **story.to.design** - For Storybook integration
- **Figma to React** - For reverse engineering (if needed)

### Automation Tools
- **Style Dictionary** - For token transformation
- **GitHub Actions** - For automated sync
- **Figma API** - For programmatic updates

## Implementation Checklist

- [ ] Install Token Studio plugin in Figma
- [ ] Create design tokens export script
- [ ] Set up Storybook (optional)
- [ ] Create component stories
- [ ] Export themes to design tokens
- [ ] Import tokens to Figma
- [ ] Create component templates
- [ ] Document component APIs
- [ ] Set up sync automation
- [ ] Test design-code consistency

## Next Steps

1. Choose your preferred method (Design Tokens recommended)
2. Run the export scripts
3. Set up your Figma file structure
4. Import your design system
5. Create component documentation
6. Establish a sync workflow

This approach will give you a comprehensive Figma design system that stays in sync with your React Native codebase, enabling better design-development collaboration for Hero's Path.