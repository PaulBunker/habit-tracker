Feature: Quick Habit Creation
  As a user
  I want to quickly add habits with just a name
  So that I don't get bogged down in configuration

  Scenario: Add habit with name only
    Given I am on the daily checklist
    When I tap the add habit button
    And I enter "Drink water" as the habit name
    And I press Enter
    Then "Drink water" should appear in my habit list
    And it should have no start time
    And it should have no deadline
    And it should be active every day

  Scenario: Cancel adding a habit
    Given I am on the add habit input
    When I press Escape
    Then the input should close
    And no habit should be created

  Scenario: Cannot add empty habit name
    Given I am on the add habit input
    When I try to submit without entering a name
    Then the habit should not be created
    And I should see a validation message

  Scenario: New habit appears at bottom of list
    Given I have existing habits with deadlines
    When I create a new habit "Read a book"
    Then "Read a book" should appear at the bottom of the list
    Because it has no deadline
