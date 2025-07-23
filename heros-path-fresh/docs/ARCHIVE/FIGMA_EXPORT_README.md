# 🎨 Hero's Path Design System → Figma Export

Your Hero's Path design system has been successfully prepared for Figma export! This package includes all your themes, components, and design tokens ready to be imported into Figma.

## 📦 What's Included

✅ **155 Design Tokens** exported from your codebase:
- **129 Color Tokens** (43 per theme × 3 themes)
- **6 Spacing Tokens** (xs, sm, md, lg, xl, xxl)
- **8 Typography Tokens** (h1-h4, body, caption, button, etc.)
- **9 Layout Constants** (border radius, heights, padding)
- **3 Shadow Styles** (small, medium, large)

✅ **3 Complete Themes**:
- **Light Theme** - Clean, modern iOS-style interface
- **Dark Theme** - Battery-efficient dark mode  
- **Adventure Theme** - Fantasy-inspired Zelda-like theme

✅ **9 Component Templates** ready for design:
- AppButton, Card, Divider, ListItem, SectionHeader
- ZeldaButton, ZeldaToggle, PingButton, PingAnimation

## 🚀 Quick Start (5 Minutes)

### Step 1: Install Token Studio Plugin
1. Open Figma
2. Go to Plugins → Browse all plugins
3. Search for "Tokens Studio for Figma"
4. Install the plugin

### Step 2: Import Your Design Tokens
1. Create a new Figma file called "Hero's Path Design System"
2. Open the Token Studio plugin (Plugins → Tokens Studio)
3. Click the **Settings** gear icon
4. Choose **File** as your sync provider
5. Click **Import** and upload `figma-design-tokens.json`
6. Click **Apply** to create Figma styles and variables

### Step 3: Start Designing!
Your tokens are now available as:
- **Color Styles** for backgrounds, text, and UI elements
- **Text Styles** for typography
- **Effect Styles** for shadows
- **Variables** for dynamic theming

## 🎯 Using Your Design System in Figma

### Color Tokens
All your theme colors are now available in Figma's color picker:

```
Light Theme:
• Primary: #007AFF (iOS Blue)
• Secondary: #5856D6 (Purple)
• Background: #FFFFFF (White)
• Surface: #F2F2F7 (Light Gray)

Dark Theme:
• Primary: #0A84FF (Brighter Blue)
• Secondary: #5E5CE6 (Lighter Purple)
• Background: #000000 (Black)
• Surface: #1C1C1E (Dark Gray)

Adventure Theme:
• Primary: #4A90E2 (Fantasy Blue)
• Secondary: #F5A623 (Gold)
• Background: #2C3E50 (Dark Blue-Gray)
• Surface: #34495E (Medium Gray)
```

### Spacing System
Use consistent spacing with your predefined tokens:
- **XS**: 4px - Micro spacing
- **SM**: 8px - Small padding/margins
- **MD**: 16px - Standard spacing
- **LG**: 24px - Large sections
- **XL**: 32px - Major layout spacing
- **XXL**: 48px - Hero sections

### Typography Scale
Your typography tokens create consistent text hierarchy:
- **H1**: 28px/Bold - Page titles
- **H2**: 24px/SemiBold - Section headers
- **H3**: 20px/SemiBold - Subsections
- **Body**: 16px/Regular - Main content
- **Caption**: 12px/Regular - Small text

## 🔄 Keeping Design and Code in Sync

### When You Update Your Code
1. Modify colors/spacing in `styles/theme.js`
2. Run: `npm run export-to-figma`
3. Re-import the updated `figma-design-tokens.json` in Token Studio
4. Click **Update** to sync changes to Figma

### Setting Up Automated Sync (Advanced)
You can automate this process with GitHub Actions:

```yaml
# .github/workflows/sync-figma.yml
name: Sync Design Tokens to Figma
on:
  push:
    paths: ['styles/theme.js']
jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm run export-to-figma
      - uses: figma/github-action@v1
        with:
          token: ${{ secrets.FIGMA_TOKEN }}
          file: figma-design-tokens.json
```

## 🎨 Creating Components in Figma

### Building Your Component Library

1. **Create Component Pages**
   - Make separate pages for each component type
   - Use consistent naming: "Components/Buttons", "Components/Cards"

2. **Component Structure Example - AppButton**
   ```
   AppButton [Master Component]
   ├── Properties Panel:
   │   ├── Variant (Primary, Secondary, Danger)
   │   ├── Size (Default, Small)
   │   └── State (Default, Disabled)
   └── Variants:
       ├── Primary/Default/Default
       ├── Primary/Default/Disabled
       ├── Secondary/Default/Default
       └── etc...
   ```

3. **Apply Design Tokens**
   - Use color tokens for all fills and strokes
   - Apply typography tokens to text layers
   - Use spacing tokens for padding and margins
   - Apply shadow tokens for elevation effects

### ZeldaButton Component Example

The ZeldaButton from your code has these special features:
- Corner decorations (use the Corner.svg asset)
- Fantasy-themed styling
- Selection states with glowing effects
- Adventure theme colors

In Figma, create this as:
1. Base rectangle with Adventure theme colors
2. Corner SVG components in each corner
3. Text layer with Roboto Medium Italic
4. Selected state with glow effect (use shadow tokens)

## 📱 Mobile-First Design Guidelines

Since this is a React Native app, keep these mobile principles in mind:

### Touch Targets
- Minimum 44px height for buttons (use `buttonHeight` token)
- Use spacing tokens for adequate touch spacing

### Platform Considerations
- iOS: Use SF Symbols style icons
- Android: Material Design principles
- Use Platform API considerations from your code

### Screen Sizes
Design for multiple breakpoints:
- iPhone SE: 375×667
- iPhone 14: 390×844  
- iPhone 14 Pro Max: 428×926
- iPad: 1024×1366

## 🛠️ Advanced Features

### Multi-Theme Components
Create components that work across all three themes:
1. Use color variables instead of fixed colors
2. Create variants for each theme if needed
3. Test components against all theme backgrounds

### Animation Planning
For components like PingAnimation and PingButton:
1. Design static states in Figma
2. Use Figma's prototyping for basic animations
3. Document complex animations for developers
4. Reference the actual React Native animation code

### Asset Management
Your existing assets are in `/assets`:
- Use Corner.svg for Zelda-themed components
- Import link sprites for character animations
- Use background textures for themed surfaces

## 📋 Component Checklist

When creating each component in Figma:

- [ ] **AppButton**
  - [ ] Primary, Secondary, Danger variants
  - [ ] Default and disabled states
  - [ ] Proper color token usage
  - [ ] Consistent typography

- [ ] **Card**
  - [ ] Surface color from tokens
  - [ ] Shadow effect applied
  - [ ] Proper border radius

- [ ] **ZeldaButton**
  - [ ] Corner decorations
  - [ ] Adventure theme colors
  - [ ] Selection state with glow
  - [ ] Roboto Medium Italic font

- [ ] **Theme Documentation**
  - [ ] Color palette pages
  - [ ] Typography specimens
  - [ ] Spacing examples
  - [ ] Component usage guidelines

## 🤝 Collaboration Workflow

### For Designers
1. Use the imported design system for all Hero's Path designs
2. Stick to defined color tokens and spacing
3. Document any new patterns or components needed
4. Share Figma prototypes with developers

### For Developers  
1. Reference Figma designs for accurate implementation
2. Use the same token names in code and design
3. Update the design system when adding new features
4. Re-export tokens when themes change

### Design-Dev Handoff
- Components in Figma match React Native component APIs
- Token names are identical between platforms
- Clear documentation of interactive states
- Figma Dev Mode shows exact token usage

## 🎯 Next Steps

1. **Import your tokens** into Figma using the guide above
2. **Create your first component** (start with AppButton)
3. **Build your component library** systematically
4. **Document usage patterns** for your team
5. **Set up sync automation** for ongoing maintenance

## 🆘 Need Help?

### Common Issues
- **Tokens not importing**: Check JSON syntax and file format
- **Colors not matching**: Verify hex codes in export
- **Missing fonts**: Install required fonts on your system
- **Sync errors**: Check Token Studio plugin version

### Resources
- [Token Studio Documentation](https://docs.tokens.studio/)
- [Figma Design Systems Guide](https://help.figma.com/hc/en-us/articles/360038663994)
- [React Native Design Guidelines](https://reactnative.dev/docs/design)

### Support
- Check the Hero's Path documentation in `/docs`
- Review component code in `/components`
- Reference theme definitions in `/styles/theme.js`

---

**Happy designing! Your Hero's Path design system is now ready for Figma! 🎨✨**