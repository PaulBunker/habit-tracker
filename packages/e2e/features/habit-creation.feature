Feature: Habit Creation
  As a user
  I want to create habits with deadlines and blocked websites
  So that I can track my daily habits and stay accountable

  Scenario: Create a basic daily habit
    Given I am on the habit creation page
    When I enter "Morning Exercise" as the habit name
    And I set the deadline to "09:00"
    And I save the habit
    Then I should see "Morning Exercise" in my habit list
    And the habit should have a deadline of "09:00"

  Scenario: Create a habit with blocked websites
    Given I am on the habit creation page
    When I enter "Study Session" as the habit name
    And I set the deadline to "14:00"
    And I add "reddit.com" to the blocked websites
    And I add "twitter.com" to the blocked websites
    And I save the habit
    Then I should see "Study Session" in my habit list
    And the habit should block "reddit.com" and "twitter.com"

  Scenario: Create a habit with description
    Given I am on the habit creation page
    When I enter "Read 30 minutes" as the habit name
    And I enter "Read at least 30 minutes of a book" as the description
    And I set the deadline to "21:00"
    And I save the habit
    Then I should see "Read 30 minutes" in my habit list
    And the habit should have the description "Read at least 30 minutes of a book"

  Scenario: Validation prevents creating habit without required fields
    Given I am on the habit creation page
    When I try to save the habit without entering a name
    Then I should see an error message "Habit name is required"
    And the habit should not be created

  Scenario: Validation prevents creating habit without deadline
    Given I am on the habit creation page
    When I enter "Test Habit" as the habit name
    And I try to save the habit without setting a deadline
    Then I should see an error message "Deadline is required"
    And the habit should not be created

  Scenario: Invalid website domain is rejected
    Given I am on the habit creation page
    When I enter "Focus Time" as the habit name
    And I set the deadline to "10:00"
    And I try to add "not-a-valid-domain" to the blocked websites
    Then I should see an error message "Invalid domain format"
    And the blocked website should not be added
