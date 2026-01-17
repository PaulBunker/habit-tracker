Feature: Habit Completion and Unblocking
  As a user
  I want to complete or skip my habits
  So that blocked websites become accessible again

  Scenario: Complete habit to unblock sites
    Given websites are currently blocked for "Morning Exercise"
    When I complete the habit
    Then all blocked websites should be accessible
    And the habit status should be "completed"
    And the completion time should be recorded

  Scenario: Complete habit before deadline
    Given I have a habit "Meditation" with deadline "08:00"
    And the habit blocks "instagram.com"
    When the time is "07:45"
    And I complete the habit
    Then the habit status should be "completed"
    And "instagram.com" should remain accessible
    And the completion time should be "07:45"

  Scenario: Complete habit after deadline unblocks websites
    Given I have a habit "Reading" with deadline "21:00"
    And the habit blocks "reddit.com,twitter.com"
    And the time is "21:30"
    And the websites are currently blocked
    When I complete the habit
    Then "reddit.com" should become accessible
    And "twitter.com" should become accessible
    And the habit status should be "completed"

  Scenario: Skip habit with reason
    Given I have a habit "Gym Session" with deadline "18:00"
    And the habit blocks "youtube.com"
    When the time is "17:30"
    And I skip the habit with reason "Injured ankle"
    Then the habit status should be "skipped"
    And the skip reason should be "Injured ankle"
    And "youtube.com" should remain accessible

  Scenario: Cannot skip habit without providing a reason
    Given I have a habit "Morning Jog" with deadline "07:00"
    When I try to skip the habit without a reason
    Then I should see an error message "Skip reason is required"
    And the habit should not be marked as skipped

  Scenario: Skip habit after deadline prevents blocking
    Given I have a habit "Study Time" with deadline "14:00"
    And the habit blocks "facebook.com"
    And the time is "14:05"
    And the websites are currently blocked
    When I skip the habit with reason "Emergency came up"
    Then "facebook.com" should become accessible
    And the habit status should be "skipped"

  Scenario: View habit completion history
    Given I have a habit "Daily Writing"
    And I completed it on "2026-01-15" at "10:30"
    And I completed it on "2026-01-16" at "09:45"
    And I skipped it on "2026-01-17" with reason "Traveling"
    When I view the habit history
    Then I should see 3 log entries
    And the entry for "2026-01-15" should show status "completed" at "10:30"
    And the entry for "2026-01-16" should show status "completed" at "09:45"
    And the entry for "2026-01-17" should show status "skipped" with reason "Traveling"

  Scenario: Daemon detects missed habit and marks it
    Given I have a habit "Exercise" with deadline "09:00"
    And the habit blocks "news.com"
    When the time becomes "09:01"
    And I haven't completed or skipped the habit
    Then the daemon should automatically mark it as "missed"
    And "news.com" should be blocked
    And a log entry should be created with status "missed"

  Scenario: Complete multiple habits to unblock all sites
    Given I have a habit "Morning Routine" that blocks "reddit.com"
    And I have a habit "Study Time" that blocks "twitter.com"
    And both habits are overdue
    And both "reddit.com" and "twitter.com" are blocked
    When I complete "Morning Routine"
    Then "reddit.com" should become accessible
    And "twitter.com" should remain blocked
    When I complete "Study Time"
    Then "twitter.com" should become accessible

  Scenario: Completion timestamp respects user's timezone
    Given I am in timezone "America/New_York" (UTC-5)
    And I have a habit "Morning Workout" with deadline "09:00" local time
    When the UTC time is "14:00" (09:00 EST)
    And I complete the habit
    Then the completion time should be stored as "14:00" UTC
    And displayed to me as "09:00" EST
