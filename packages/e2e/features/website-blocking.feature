Feature: Time-Based Website Blocking
  As a user
  I want websites blocked when habits become active and unblocked when completed
  So that I stay focused on my morning routine

  Background:
    Given the global blocked websites list contains:
      | website       |
      | reddit.com    |
      | twitter.com   |
      | youtube.com   |

  Scenario: Blocking starts at habit start time
    Given I have a habit "Make bed" with start time 07:00
    And the current time is 06:59
    Then reddit.com should not be blocked
    When the time becomes 07:00
    And the habit is not completed
    Then reddit.com should be blocked

  Scenario: Blocking ends when habit is completed
    Given I have a habit "Make bed" with start time 07:00
    And the current time is 08:00
    And reddit.com is blocked
    When I complete "Make bed"
    Then reddit.com should be unblocked

  Scenario: Multiple habits can trigger blocking
    Given I have habits:
      | name        | startTime | completed |
      | Make bed    | 07:00     | true      |
      | Brush teeth | 07:00     | false     |
    And the current time is 08:00
    Then reddit.com should still be blocked
    When I complete "Brush teeth"
    Then reddit.com should be unblocked

  Scenario: Habits without start time never block
    Given I have a habit "Practice bass" with no start time
    And the habit is not completed
    Then reddit.com should not be blocked due to "Practice bass"

  Scenario: Evening habits don't block until their start time
    Given I have a habit "Track dinner" with start time 17:00
    And the current time is 12:00
    And the habit is not completed
    Then reddit.com should not be blocked due to "Track dinner"
    When the time becomes 17:00
    Then reddit.com should be blocked

  Scenario: Blocking ends at midnight
    Given I have a habit "Make bed" with start time 07:00
    And the habit is not completed
    And the current time is 23:59
    Then reddit.com should be blocked
    When the time becomes 00:00 the next day
    Then reddit.com should be unblocked
    And "Make bed" should be marked as missed for yesterday

  Scenario: All timed habits must be complete to unblock
    Given I have habits:
      | name           | startTime | completed |
      | Make bed       | 07:00     | true      |
      | Brush teeth    | 07:00     | true      |
      | Track lunch    | 12:00     | false     |
    And the current time is 13:00
    Then reddit.com should be blocked
    When I complete "Track lunch"
    Then reddit.com should be unblocked
