# Requirements Document

## Introduction

The Past Journeys Review feature is a critical user retention component that provides users with a comprehensive history of their completed journeys. It allows users to track their exploration progress, visualize their routes on a map, manage their journey history, and access associated discoveries. This feature serves as both a personal walking diary and a gateway to reviewing discoveries from past walks, enhancing the overall user experience by providing historical context to their exploration activities.

## Requirements

### Requirement 1: Journey History Display

**User Story:** As a user, I want to view a chronological list of my completed journeys, so that I can track my exploration progress over time.

#### Acceptance Criteria

1. WHEN the user navigates to the Past Journeys screen THEN the system SHALL display a chronological list of all completed journeys.
2. WHEN journeys are displayed THEN the system SHALL show key metadata including date, time, distance, and duration for each journey.
3. WHEN the user has no completed journeys THEN the system SHALL display an appropriate empty state message.
4. WHEN the screen is loading journey data THEN the system SHALL display a loading indicator.
5. WHEN the user returns to the Past Journeys screen THEN the system SHALL automatically refresh the journey list.
6. WHEN the number of journeys exceeds a threshold THEN the system SHALL implement pagination or virtualized list rendering to maintain performance.
7. WHEN displaying a large number of journeys THEN the system SHALL group journeys by time periods (e.g., months) with collapsible headers to improve navigation.

### Requirement 2: Journey Completion Status Tracking

**User Story:** As a user, I want to see the completion status of each journey, so that I can easily identify which journeys still have discoveries to review.

#### Acceptance Criteria

1. WHEN a journey is displayed THEN the system SHALL indicate whether all discoveries for that journey have been reviewed.
2. WHEN a journey has unreviewed discoveries THEN the system SHALL display a "Review" status indicator.
3. WHEN all discoveries for a journey have been reviewed THEN the system SHALL display an "All Reviewed" status indicator.
4. WHEN the user reviews discoveries for a journey THEN the system SHALL update the journey's completion status in real-time.
5. WHEN calculating completion status THEN the system SHALL track the percentage of reviewed discoveries per journey.

### Requirement 3: Journey Detail Access

**User Story:** As a user, I want to access detailed information about a specific journey, so that I can review its route and associated discoveries.

#### Acceptance Criteria

1. WHEN the user taps on a journey THEN the system SHALL navigate to the Discoveries screen filtered for that journey.
2. WHEN viewing journey details THEN the system SHALL display the journey's route on a map.
3. WHEN viewing journey details THEN the system SHALL show all discoveries associated with that journey.
4. WHEN the user reviews discoveries from a journey THEN the system SHALL update the journey's completion status.

### Requirement 4: Journey Management

**User Story:** As a user, I want to manage my journey history, so that I can keep my history organized and remove unwanted journeys.

#### Acceptance Criteria

1. WHEN viewing the journey list THEN the system SHALL provide options to delete individual journeys.
2. WHEN the user attempts to delete a journey THEN the system SHALL display a confirmation dialog.
3. WHEN the user confirms journey deletion THEN the system SHALL delete the journey and all associated data.
4. WHEN deleting a journey THEN the system SHALL ensure no orphaned data remains in the database.
5. WHEN a journey is deleted THEN the system SHALL update the UI to reflect the change immediately.

### Requirement 5: Performance Optimization

**User Story:** As a user, I want the Past Journeys screen to load quickly and respond immediately to my actions, so that I can efficiently review my journey history.

#### Acceptance Criteria

1. WHEN loading journey data THEN the system SHALL implement smart caching to minimize API calls.
2. WHEN the user has existing journeys THEN the system SHALL skip API calls for journeys that already have discoveries in Firestore.
3. WHEN the user manually refreshes the screen THEN the system SHALL sync the UI state with the database.
4. WHEN implementing the feature THEN the system SHALL achieve a significant reduction in API calls for journey reviews.
5. WHEN displaying journey data THEN the system SHALL optimize rendering to maintain smooth scrolling performance.

### Requirement 6: Data Consistency

**User Story:** As a user, I want my journey data to remain consistent across the app, so that I can trust the information displayed.

#### Acceptance Criteria

1. WHEN a journey's completion status changes THEN the system SHALL update all related data in Firestore collections.
2. WHEN discovery records are modified THEN the system SHALL ensure journey completion status is updated accordingly.
3. WHEN a journey is deleted THEN the system SHALL ensure comprehensive cleanup of all associated data.
4. WHEN displaying journey data THEN the system SHALL ensure consistency between the UI and database state.
5. WHEN implementing data operations THEN the system SHALL use transactions or batched writes where appropriate to maintain data integrity.