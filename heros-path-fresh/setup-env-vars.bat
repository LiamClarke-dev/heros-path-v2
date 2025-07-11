@echo off
echo Setting up EAS environment variables...

eas env:create --scope project --name GOOGLE_MAPS_API_KEY_ANDROID --value "AIzaSyDXt55Oq7MLIaqL2XP9D_O1RLk4U-nkyUY" --type string
eas env:create --scope project --name GOOGLE_MAPS_API_KEY_IOS --value "AIzaSyBxncbCCZWc726tmkY4HYEW15vpawdpZqs" --type string
eas env:create --scope project --name GOOGLE_ROADS_API_KEY --value "AIzaSyA5YYKR663WleI-jiRP_gGk5xIiJVvl0zY" --type string

eas env:create --scope project --name FIREBASE_API_KEY --value "AIzaSyCylcK9_t7Au80L5557-98RBTSurotjYNY" --type string
eas env:create --scope project --name FIREBASE_AUTH_DOMAIN --value "heros-path-app-c3036.firebaseapp.com" --type string
eas env:create --scope project --name FIREBASE_PROJECT_ID --value "heros-path-app-c3036" --type string
eas env:create --scope project --name FIREBASE_STORAGE_BUCKET --value "heros-path-app-c3036.firebasestorage.app" --type string
eas env:create --scope project --name FIREBASE_MESSAGING_SENDER_ID --value "940276857511" --type string
eas env:create --scope project --name FIREBASE_APP_ID --value "1:940276857511:web:eeee922280841a53da7982" --type string
eas env:create --scope project --name FIREBASE_MEASUREMENT_ID --value "G-05Y414BD4P" --type string

eas env:create --scope project --name GOOGLE_WEB_CLIENT_ID --value "837481713321-326ul8r50tvlq4qrh04o07an5faejgu9.apps.googleusercontent.com" --type string
eas env:create --scope project --name GOOGLE_IOS_REVERSED_CLIENT_ID --value "837481713321-40s13frips5cqaq3gp2e0qs715qaamj5.apps.googleusercontent.com" --type string
eas env:create --scope project --name GOOGLE_ANDROID_CLIENT_ID --value "837481713321-rl79smcf45h5r1n8u4ecu090l3gqjnvo.apps.googleusercontent.com" --type string

echo Environment variables setup complete!
pause 