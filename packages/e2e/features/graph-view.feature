Feature: Graph View for Data Tracking
  As a user
  I want to see my tracked data on a line graph
  So that I can visualize trends over time

  Background:
    Given I have a data-tracking habit "Weigh myself" with unit "lbs"
    And I have the following data points:
      | date       | value |
      | 2026-01-17 | 181.5 |
      | 2026-01-16 | 182.0 |
      | 2026-01-15 | 183.0 |
      | 2026-01-14 | 182.5 |
      | 2026-01-01 | 186.0 |

  Scenario: View graph for a data habit
    Given I am in the settings panel for "Weigh myself"
    When I tap "View Graph"
    Then I should see a line graph
    And the Y-axis should be labeled "lbs"
    And the X-axis should show dates
    And the Y-axis range should fit the data

  Scenario: Select custom date range
    Given I am on the graph view
    When I open the date picker
    And I select January 10 to January 17
    Then the graph should show only data points in that range

  Scenario: Graph shows data points connected by lines
    Given I am on the graph view
    Then each data point should be visible on the graph
    And the points should be connected by a line

  Scenario: Non-data habits don't show graph option
    Given I have a simple habit "Make bed" without data tracking
    When I open its settings panel
    Then I should not see a "View Graph" button

  Scenario: Navigate back to settings
    Given I am on the graph view
    When I tap the back arrow
    Then I should see the habit settings panel
