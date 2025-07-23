# Implementation Plan

- [ ] 1. Set up core consolidation service structure
  - Create or update the DiscoveryConsolidationService.js file with basic structure
  - Implement service singleton pattern for consistency with other services
  - Add comprehensive JSDoc comments and documentation
  - _Requirements: 1.1, 4.1_

- [ ] 2. Implement data retrieval methods
  - [ ] 2.1 Implement SAR results retrieval
    - Create getSARResults method to fetch Search Along Route results
    - Add source metadata to SAR results
    - Implement error handling for SAR API failures
    - _Requirements: 1.1, 1.4, 4.4_

  - [ ] 2.2 Implement ping results retrieval
    - Create getPingResultsForJourney method to fetch ping results
    - Add error handling for ping data retrieval failures
    - _Requirements: 1.1, 1.4, 4.4_

  - [ ] 2.3 Implement place extraction from ping results
    - Create extractPlacesFromPingResults method
    - Normalize ping data to match expected place structure
    - Add source metadata to ping places
    - _Requirements: 1.1, 1.4, 2.1_

- [ ] 3. Implement deduplication and merging logic
  - [ ] 3.1 Implement place grouping by placeId
    - Create deduplicateAndMergePlaces method
    - Group places by placeId to identify duplicates
    - Handle edge cases like missing placeIds
    - _Requirements: 1.2, 1.3, 4.4_

  - [ ] 3.2 Implement intelligent place merging
    - Create mergePlaceGroup method
    - Implement source prioritization logic
    - Implement data quality prioritization
    - Combine place types from all sources
    - Use best available ratings and user rating counts
    - Use most complete address information
    - _Requirements: 1.3, 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ] 3.3 Implement source tracking
    - Add primarySource and allSources fields to merged places
    - Track ping and SAR counts for each place
    - _Requirements: 1.4, 2.6, 3.3_

- [ ] 4. Implement storage and persistence
  - [ ] 4.1 Implement consolidated discovery storage
    - Create saveConsolidatedDiscoveries method
    - Transform merged places into discovery data structure
    - Use DiscoveryService to create discovery records
    - Implement batch processing for efficiency
    - _Requirements: 3.1, 3.2, 3.3, 4.1_

  - [ ] 4.2 Implement ping results archiving
    - Add call to PingService.archivePingResults
    - Ensure temporary data is cleaned up after consolidation
    - _Requirements: 3.5, 4.5_

  - [ ] 4.3 Implement consolidation statistics
    - Create getConsolidationStats method
    - Track and return statistics about the consolidation process
    - _Requirements: 3.3, 4.3_

- [ ] 5. Implement main consolidation workflow
  - [ ] 5.1 Implement consolidateJourneyDiscoveries method
    - Orchestrate the entire consolidation process
    - Add comprehensive logging for debugging and monitoring
    - Implement performance tracking
    - Return detailed consolidation results
    - _Requirements: 1.1, 4.1, 4.3_

  - [ ] 5.2 Implement error handling and recovery
    - Add try/catch blocks for all critical operations
    - Implement graceful degradation for partial failures
    - Ensure process continues even if some steps fail
    - _Requirements: 3.5, 4.4_

- [ ] 6. Integrate with JourneyService
  - [ ] 6.1 Update JourneyService to trigger consolidation
    - Add consolidation call after journey completion
    - Pass necessary parameters to consolidation service
    - _Requirements: 1.1, 5.1_

  - [ ] 6.2 Implement journey completion status updates
    - Ensure journey completion status is updated after consolidation
    - _Requirements: 3.4, 5.1_

- [ ] 7. Integrate with DiscoveriesScreen
  - [ ] 7.1 Update DiscoveriesScreen to handle consolidated discoveries
    - Ensure consistent display of consolidated discoveries
    - Maintain all discovery interaction functionality
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ] 7.2 Implement discovery filtering for consolidated discoveries
    - Ensure filters work correctly with consolidated discoveries
    - _Requirements: 5.4_

- [ ] 8. Implement progress indicators
  - [ ] 8.1 Add loading indicators during consolidation
    - Show appropriate progress indicators to users
    - Provide feedback about consolidation progress
    - _Requirements: 4.2_

  - [ ] 8.2 Add completion notifications
    - Notify users when consolidation is complete
    - Show summary of consolidation results
    - _Requirements: 4.3, 5.1_

- [ ] 9. Write comprehensive tests
  - [ ] 9.1 Write unit tests for core methods
    - Test deduplication and merging logic
    - Test data transformation and normalization
    - _Requirements: 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ] 9.2 Write integration tests
    - Test interaction with other services
    - Test end-to-end consolidation flow
    - _Requirements: 1.1, 3.1, 3.4, 4.1_

  - [ ] 9.3 Write edge case tests
    - Test error handling and recovery
    - Test with various data combinations and edge cases
    - _Requirements: 3.5, 4.4_