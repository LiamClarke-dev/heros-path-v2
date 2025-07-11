# Google OAuth Setup Guide for Hero's Path

## Prerequisites
- Google Cloud Console project
- Firebase project configured
- EAS CLI installed and configured

## Step 1: Google Cloud Console Setup

### 1.1 Create OAuth 2.0 Client IDs

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** > **Credentials**
4. Click **+ CREATE CREDENTIALS** > **OAuth 2.0 Client IDs**

### 1.2 Create Web Client ID
1. Application type: **Web application**
2. Name: `Hero's Path Web Client`
3. Authorized JavaScript origins:
   - `https://auth.expo.io`
   - `https://expo.dev`
4. Authorized redirect URIs:
   - `https://auth.expo.io/@liamclarke-dev/heros-path-fresh`
   - `https://expo.dev/accounts/liamclarke-dev/projects/heros-path-fresh`
5. Copy the **Client ID** - this is your `GOOGLE_WEB_CLIENT_ID`

### 1.3 Create iOS Client ID
1. Application type: **iOS**
2. Name: `Hero's Path iOS Client`
3. Bundle ID: `com.liamclarke.herospath`
4. Copy the **Client ID** - this is your `GOOGLE_IOS_REVERSED_CLIENT_ID`

### 1.4 Create Android Client ID
1. Application type: **Android**
2. Name: `Hero's Path Android Client`
3. Package name: `com.liamclarke.herospath`
4. SHA-1 certificate fingerprint: (get this from your keystore)
5. Copy the **Client ID** - this is your `GOOGLE_ANDROID_CLIENT_ID`

## Step 2: Configure Redirect URIs

### 2.1 Add Redirect URIs to Web Client
Add these to your Web Client ID's authorized redirect URIs:
- `com.liamclarke.herospath://oauthredirect`
- `exp+heros-path-fresh://expo-development-client/oauthredirect`

### 2.2 Verify OAuth Consent Screen
1. Go to **OAuth consent screen**
2. Add your app name: `Hero's Path`
3. Add scopes: `email`, `profile`, `openid`
4. Add test users if in testing mode

## Step 3: Environment Variables

### 3.1 Set in EAS
```bash
eas secret:create --scope project --name GOOGLE_WEB_CLIENT_ID --value "your-web-client-id"
eas secret:create --scope project --name GOOGLE_IOS_REVERSED_CLIENT_ID --value "your-ios-client-id"
eas secret:create --scope project --name GOOGLE_ANDROID_CLIENT_ID --value "your-android-client-id"
```

### 3.2 Local Development (.env file)
```env
GOOGLE_WEB_CLIENT_ID=your-web-client-id
GOOGLE_IOS_REVERSED_CLIENT_ID=your-ios-client-id
GOOGLE_ANDROID_CLIENT_ID=your-android-client-id
```

## Step 4: Build and Test

### 4.1 Rebuild Development Client
```bash
eas build --profile development --platform ios
```

### 4.2 Test OAuth Flow
1. Install the new development build
2. Open the app
3. Try signing in with Google
4. Check logs for any errors

## Troubleshooting

### Common Issues

1. **"redirect_uri_mismatch" error**
   - Verify redirect URIs in Google Cloud Console
   - Check that scheme in app.json matches

2. **"invalid_client" error**
   - Verify client IDs are correct
   - Check that environment variables are set

3. **"access_denied" error**
   - Check OAuth consent screen configuration
   - Verify scopes are properly configured

### Debug Steps

1. Check environment variables in app:
   ```javascript
   console.log('Client IDs:', {
     web: GOOGLE_WEB_CLIENT_ID,
     ios: GOOGLE_IOS_REVERSED_CLIENT_ID,
     android: GOOGLE_ANDROID_CLIENT_ID
   });
   ```

2. Verify redirect URI:
   ```javascript
   console.log('Redirect URI:', AuthSession.makeRedirectUri({
     scheme: 'com.liamclarke.herospath',
     path: 'oauthredirect'
   }));
   ```

3. Check EAS environment variables:
   ```bash
   eas secret:list
   ```

## Important Notes

- **Never commit client IDs to Git** - use environment variables
- **Rebuild after changing environment variables** - they're injected at build time
- **Use development build for testing** - Expo Go has limitations with OAuth
- **Test on real device** - OAuth may not work in simulator

## Next Steps

After OAuth is working:
1. Test user profile creation
2. Verify Firebase authentication
3. Test social features
4. Deploy to production 