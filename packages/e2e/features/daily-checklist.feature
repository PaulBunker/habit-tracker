Feature: Daily Checklist
  As a user
  I want to see today's habits as a simple checklist
  So that I can quickly track my daily progress

  Background:
    Given I have the following habits:
      | name              | startTime | deadline |
      | Make bed          | 07:00     | 09:00    |
      | Weigh myself      | 07:00     | 09:00    |
      | Track lunch       | 12:00     | 14:00    |
      | Practice bass     |           |          |

  Scenario: View today's habits as a list
    When I open the app
    Then I should see a simple checklist of today's habits
    And habits should be sorted by deadline time
    And habits without deadlines should appear last

  Scenario: Complete a simple habit with one tap
    Given I am on the daily checklist
    When I tap the circle next to "Make bed"
    Then "Make bed" should be marked as complete
    And the circle should show a checkmark

  Scenario: Complete a data-tracking habit
    Given "Weigh myself" is configured to track data with unit "lbs"
    When I tap the circle next to "Weigh myself"
    Then a data input modal should appear
    When I enter "182.5" as the value
    And I tap "Save"
    Then "Weigh myself" should be marked as complete
    And the value "182.5 lbs" should be recorded

  Scenario: Habits only appear on active days
    Given "Practice bass" is set to active on Monday, Wednesday, Friday
    And today is Tuesday
    Then "Practice bass" should not appear in the checklist

  Scenario: Access habit settings via cog icon
    When I tap the cog icon next to "Weigh myself"
    Then the habit settings panel should open

  Scenario: Early completion is allowed
    Given "Track lunch" has start time 12:00
    And the current time is 10:00
    When I tap the circle next to "Track lunch"
    Then "Track lunch" should be marked as complete

  Scenario: Untimed habits are always visible
    Given "Practice bass" has no start time and no deadline
    When I open the app at any time of day
    Then "Practice bass" should be visible in the checklist
