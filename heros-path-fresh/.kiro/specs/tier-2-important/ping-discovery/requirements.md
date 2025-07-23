# Requirements Document

## Introduction

The Ping Discovery feature is a core interactive element of the Hero's Path app that allows users to actively discover nearby points of interest during their walks in real-time, rather than waiting until the end of their journey. This feature transforms passive walking into active exploration by giving users a "special power" to scan their surroundings on demand. The system includes a credit management system to prevent abuse, a cooldown timer to control usage frequency, visual feedback through animations, and integration with the app's discovery consolidation system.

## Requirements

### Requirement 1

**User Story:** As a user exploring new areas, I want to actively discover nearby points of interest during my walk, so that I can make real-time decisions about places to visit without waiting until the end of my journey.

#### Acceptance Criteria

1. WHEN user taps the ping button THEN the system SHALL search for nearby places within a 500m radius of the user's current location
2. WHEN user taps the ping button THEN the system SHALL display an animation to provide immediate visual feedback
3. WHEN ping search completes THEN the system SHALL display discovered places as markers on the map
4. WHEN ping search completes THEN the system SHALL show a success alert with the number of places found
5. WHEN ping search fails THEN the system SHALL display an appropriate error message explaining the reason
6. WHEN ping search completes THEN the system SHALL store the results in the user's journey data

### Requirement 2

**User Story:** As an app developer, I want to implement a credit system for the ping feature, so that we can control API usage costs while still providing value to users.

#### Acceptance Criteria

1. WHEN user opens the app for the first time THEN the system SHALL initialize the user with 50 ping credits
2. WHEN user performs a ping THEN the system SHALL deduct 1 credit from their account
3. WHEN user's credits reach 0 THEN the system SHALL prevent further ping attempts
4. WHEN 30 days have passed since the last credit reset THEN the system SHALL reset the user's credits to 50
5. WHEN credit data becomes corrupted THEN the system SHALL automatically detect and fix the corruption
6. WHEN user attempts to ping with 0 credits THEN the system SHALL display a clear message explaining why ping is unavailable

### Requirement 3

**User Story:** As a user, I want a cooldown period between pings, so that I don't accidentally use all my credits at once and can pace my discoveries throughout my walk.

#### Acceptance Criteria

1. WHEN user successfully performs a ping THEN the system SHALL enforce a 10-second cooldown before allowing another ping
2. WHEN user attempts to ping during cooldown THEN the system SHALL display the remaining cooldown time
3. WHEN cooldown period ends THEN the system SHALL automatically re-enable the ping button
4. WHEN ping button is in cooldown THEN the system SHALL visually indicate the cooldown status
5. WHEN cooldown is active THEN the system SHALL display a countdown timer showing seconds remaining

### Requirement 4

**User Story:** As a user, I want clear visual feedback when I use the ping feature, so that I know the action is working even before results appear.

#### Acceptance Criteria

1. WHEN user taps the ping button THEN the system SHALL immediately display an animation centered on the user's position
2. WHEN user taps the ping button THEN the system SHALL re-center the map to the current latitude/longitude of the user
3. WHEN ping animation is active THEN the system SHALL ensure the animation pulse is centered on the user's sprite location
4. WHEN ping animation is active THEN the system SHALL make the animation appear as though it is emitting from the user's sprite
5. WHEN ping animation is active THEN the system SHALL ensure it doesn't block interaction with the map
6. WHEN ping animation is active THEN the system SHALL use visual elements consistent with the app's design language
7. WHEN ping animation completes THEN the system SHALL smoothly transition to showing results
8. WHEN ping animation is active THEN the system SHALL respect the user's device theme settings

### Requirement 5

**User Story:** As a user, I want to see my ping credit status and usage statistics, so that I can manage my ping usage effectively.

#### Acceptance Criteria

1. WHEN user views the map screen THEN the system SHALL display their current ping credit count
2. WHEN user's credits are low (≤5) THEN the system SHALL provide a visual indicator of low credits
3. WHEN user taps on the credit display THEN the system SHALL show detailed ping statistics
4. WHEN ping statistics are displayed THEN the system SHALL show credits remaining, total pings used, monthly limit, and cooldown time
5. WHEN ping statistics are displayed THEN the system SHALL provide educational information about how the ping feature works
6. WHEN ping statistics are displayed THEN the system SHALL provide a refresh button to update the statistics

### Requirement 6

**User Story:** As a user, I want my ping discoveries to respect my discovery preferences, so that I only see places that interest me.

#### Acceptance Criteria

1. WHEN user performs a ping THEN the system SHALL filter results based on the user's discovery preferences
2. WHEN user performs a ping THEN the system SHALL only return places with ratings that meet or exceed the user's minimum rating preference
3. WHEN user has no enabled place types in preferences THEN the system SHALL inform the user that no place types are enabled
4. WHEN ping search completes THEN the system SHALL deduplicate results to prevent showing the same place multiple times

### Requirement 7

**User Story:** As a user, I want ping results to be stored with my journey data, so that I can review all discoveries from my walks in one place.

#### Acceptance Criteria

1. WHEN ping search completes THEN the system SHALL store results in the user's journey data
2. WHEN journey completes THEN the system SHALL consolidate ping discoveries with route discoveries
3. WHEN ping results are stored THEN the system SHALL include metadata about the ping (timestamp, location, etc.)
4. WHEN ping results are stored THEN the system SHALL ensure data consistency and prevent corruption
5. WHEN journey is viewed in past journeys THEN the system SHALL include ping discoveries in the journey summary