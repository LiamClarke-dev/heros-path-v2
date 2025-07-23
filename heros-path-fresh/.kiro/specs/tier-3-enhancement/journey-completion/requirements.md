# Requirements Document

## Introduction

The Journey Completion feature enhances the existing journey tracking functionality in Hero's Path by providing an improved workflow for ending, naming, and saving completed journeys. Building upon the core journey tracking capabilities, this enhancement focuses on creating a more polished and user-friendly experience when concluding walks. The feature includes a full-screen naming modal with smart default naming, improved journey statistics display, better minimum distance validation, and tighter integration with the discovery process to ensure a seamless end-of-journey experience.

## Requirements

### Requirement 1: Enhanced Journey Naming Modal

**User Story:** As a user, I want a dedicated full-screen modal for naming my completed journeys, so that I can easily provide meaningful names to my walks.

#### Acceptance Criteria

1. WHEN a journey is ended THEN the system SHALL present a full-screen modal for naming the journey instead of a simple dialog.
2. WHEN the naming modal is displayed THEN the system SHALL provide a smart default name that includes the current date, time, and starting location when available.
3. WHEN the user enters a custom name THEN the system SHALL save the journey with that name and provide visual confirmation.
4. WHEN the user cancels the naming process THEN the system SHALL prompt the user to confirm if they want to save with the default name or discard the journey.
5. WHEN the naming modal is displayed THEN the system SHALL show journey statistics (distance, duration) to provide context.

### Requirement 2: Improved Minimum Distance Validation

**User Story:** As a user, I want clear feedback when my journey is too short to save, so that I understand why it can't be saved and what options I have.

#### Acceptance Criteria

1. WHEN a journey does not meet minimum distance requirements THEN the system SHALL display a dedicated modal explaining why the journey cannot be saved.
2. WHEN a journey with pings is not saved due to minimum distance THEN the system SHALL refund any ping credits used during that journey.
3. WHEN the minimum distance modal is displayed THEN the system SHALL provide options to continue the journey or discard it.
4. WHEN the user chooses to discard a journey THEN the system SHALL clear all journey data and reset the tracking state.
5. WHEN the minimum distance validation fails THEN the system SHALL log the event for analytics purposes.

### Requirement 3: Enhanced Journey Statistics Display

**User Story:** As a user, I want to see comprehensive statistics about my completed journey in the naming modal, so that I can decide whether to save it and what to name it.

#### Acceptance Criteria

1. WHEN the journey naming modal is displayed THEN the system SHALL show the total distance walked in an easy-to-read format.
2. WHEN the journey naming modal is displayed THEN the system SHALL show the total duration of the journey in hours and minutes.
3. WHEN the journey naming modal is displayed THEN the system SHALL show a small map preview of the route if possible.
4. WHEN the journey naming modal is displayed THEN the system SHALL show the number of pings used during the journey.
5. WHEN the journey statistics are displayed THEN the system SHALL use appropriate formatting and units based on the user's locale.

### Requirement 4: Improved Discovery Process Integration

**User Story:** As a user, I want better feedback about the discovery process after completing a journey, so that I know what's happening and when my discoveries will be ready.

#### Acceptance Criteria

1. WHEN a journey is successfully saved THEN the system SHALL show a loading indicator while the discovery process runs.
2. WHEN the discovery process is completed THEN the system SHALL navigate the user to the discoveries screen with a smooth transition.
3. WHEN the discovery process finds places THEN the system SHALL show a count of how many new places were discovered.
4. WHEN the discovery process completes THEN the system SHALL display a success message indicating discoveries are ready to view.
5. IF the discovery process fails THEN the system SHALL still save the journey but provide a clear error message with retry options.

### Requirement 5: Journey Completion Error Recovery

**User Story:** As a user, I want the app to handle errors gracefully during journey completion, so that I don't lose my journey data even if something goes wrong.

#### Acceptance Criteria

1. WHEN a network error occurs during journey saving THEN the system SHALL retry the operation automatically up to 3 times.
2. WHEN all automatic retries fail THEN the system SHALL store the journey data locally and provide a manual retry option.
3. WHEN the app is reopened after a crash during journey completion THEN the system SHALL detect and offer to resume the incomplete save process.
4. WHEN a journey fails to save THEN the system SHALL provide detailed error information to help troubleshoot the issue.
5. WHEN a journey is successfully saved after a recovery THEN the system SHALL notify the user that the recovery was successful.