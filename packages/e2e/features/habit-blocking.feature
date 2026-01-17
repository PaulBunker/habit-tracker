Feature: Habit Deadline Enforcement
  As a user
  I want websites to be blocked when I miss a habit deadline
  So that I am motivated to complete my habits on time

  Scenario: Block websites when habit is overdue
    Given I have a habit "Morning Exercise" with deadline "09:00"
    And the habit blocks "reddit.com,twitter.com"
    When the time is "09:01"
    And I haven't completed the habit
    Then "reddit.com" should be blocked
    And "twitter.com" should be blocked

  Scenario: Websites remain accessible before deadline
    Given I have a habit "Evening Reading" with deadline "21:00"
    And the habit blocks "youtube.com,netflix.com"
    When the time is "20:59"
    And I haven't completed the habit
    Then "youtube.com" should be accessible
    And "netflix.com" should be accessible

  Scenario: Multiple overdue habits block all their websites
    Given I have a habit "Morning Exercise" with deadline "09:00" that blocks "reddit.com"
    And I have a habit "Study Session" with deadline "14:00" that blocks "twitter.com,instagram.com"
    When the time is "14:01"
    And I haven't completed "Morning Exercise"
    And I haven't completed "Study Session"
    Then "reddit.com" should be blocked
    And "twitter.com" should be blocked
    And "instagram.com" should be blocked

  Scenario: Completed habit does not trigger blocking
    Given I have a habit "Morning Exercise" with deadline "09:00"
    And the habit blocks "reddit.com"
    And I completed the habit at "08:30"
    When the time is "09:01"
    Then "reddit.com" should be accessible

  Scenario: Skipped habit does not trigger blocking
    Given I have a habit "Gym Session" with deadline "18:00"
    And the habit blocks "facebook.com"
    When the time is "17:55"
    And I skip the habit with reason "Feeling unwell"
    And the time becomes "18:01"
    Then "facebook.com" should be accessible

  Scenario: Daemon creates backup before modifying hosts file
    Given I have a habit "Focus Time" with deadline "10:00"
    And the habit blocks "news.com"
    When the time is "10:01"
    And I haven't completed the habit
    Then a backup of the hosts file should be created
    And the backup should be timestamped
    And the hosts file should contain an entry for "news.com"

  Scenario: Daemon logs all blocking actions
    Given I have a habit "Deep Work" with deadline "13:00"
    And the habit blocks "slack.com"
    When the time is "13:01"
    And I haven't completed the habit
    Then the daemon log should contain an entry for blocking "slack.com"
    And the log entry should include a timestamp
