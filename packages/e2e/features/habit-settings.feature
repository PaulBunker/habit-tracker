Feature: Habit Settings Panel
  As a user
  I want to configure habit details after creation
  So that I can customize blocking, tracking, and scheduling

  Background:
    Given I have a habit called "Morning routine"

  Scenario: Open settings panel
    When I tap the cog icon on "Morning routine"
    Then the settings panel should slide open
    And I should see configuration options

  Scenario: Set start time and deadline
    Given I am in the settings panel for "Morning routine"
    When I set start time to "07:00"
    And I set deadline to "09:00"
    And I save the settings
    Then the habit should block websites from 07:00 until completed

  Scenario: Enable data tracking
    Given I am in the settings panel for "Morning routine"
    When I enable data tracking
    And I set the unit to "minutes"
    And I save the settings
    Then completing this habit should prompt for a number

  Scenario: Set active days
    Given I am in the settings panel for "Morning routine"
    When I set active days to Monday, Wednesday, Friday
    And I save the settings
    Then the habit should only appear on those days

  Scenario: Delete a habit
    Given I am in the settings panel for "Morning routine"
    When I tap "Delete Habit"
    And I confirm the deletion
    Then "Morning routine" should be removed from my habits

  Scenario: View calendar from settings
    Given I am in the settings panel for "Morning routine"
    When I tap "View History"
    Then I should see the calendar view for this habit

  Scenario: View graph from settings for data habit
    Given "Morning routine" has data tracking enabled
    And I am in the settings panel
    When I tap "View Graph"
    Then I should see the graph view with my tracked data

  Scenario: Close settings panel
    Given the settings panel is open
    When I tap the back arrow
    Then the settings panel should close
    And I should see the daily checklist
