Feature: Data Entry When Completing Habits
  As a user
  I want to enter a value when completing data-tracking habits
  So that I can record measurements like weight or exercise duration

  Scenario: Data modal appears for tracking habits
    Given "Weigh myself" is configured to track data with unit "lbs"
    When I tap to complete "Weigh myself"
    Then a modal should appear asking for a value
    And the unit "lbs" should be displayed

  Scenario: Enter and save data
    Given the data entry modal is open for "Weigh myself"
    When I enter "182.5"
    And I tap "Save"
    Then the habit should be marked complete
    And 182.5 should be saved as today's value

  Scenario: Cancel data entry
    Given the data entry modal is open
    When I tap "Cancel"
    Then the modal should close
    And the habit should remain incomplete

  Scenario: Validation for numeric input
    Given the data entry modal is open
    When I enter "abc"
    And I tap "Save"
    Then I should see a validation error
    And the modal should remain open

  Scenario: Optional notes with data
    Given the data entry modal is open
    When I enter "182.5"
    And I add a note "After morning coffee"
    And I tap "Save"
    Then both the value and note should be saved

  Scenario: Decimal values are accepted
    Given the data entry modal is open
    When I enter "182.75"
    And I tap "Save"
    Then 182.75 should be saved as today's value

  Scenario: Negative values are rejected
    Given the data entry modal is open
    When I enter "-5"
    And I tap "Save"
    Then I should see a validation error
