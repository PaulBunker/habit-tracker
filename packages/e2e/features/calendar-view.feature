Feature: Calendar View
  As a user
  I want to see my habit completion history on a calendar
  So that I can visually track my consistency over time

  Background:
    Given I have a habit "Practice bass" with the following history:
      | date       | status    |
      | 2026-01-15 | completed |
      | 2026-01-14 | completed |
      | 2026-01-13 | missed    |
      | 2026-01-12 | completed |
      | 2026-01-11 | skipped   |

  Scenario: View calendar for a habit
    Given I am in the settings panel for "Practice bass"
    When I tap "View History"
    Then I should see a monthly calendar view
    And completed days should be highlighted in green
    And missed days should be highlighted in red
    And skipped days should be highlighted in gray

  Scenario: Navigate between months
    Given I am viewing the calendar for January 2026
    When I tap the left arrow
    Then I should see December 2025
    When I tap the right arrow
    Then I should see January 2026 again

  Scenario: Days without activity show as empty
    Given I am on the calendar view
    Then days with no log entry should have no highlight

  Scenario: Navigate back to settings
    Given I am on the calendar view
    When I tap the back arrow
    Then I should see the habit settings panel
