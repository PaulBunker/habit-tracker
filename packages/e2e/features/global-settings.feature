Feature: Global Settings
  As a user
  I want to manage my blocked websites in one place
  So that blocking applies consistently across all habits

  Scenario: View global settings
    When I tap the Settings icon in the header
    Then I should see the global settings page
    And I should see the blocked websites section

  Scenario: Add a website to block list
    Given I am on the global settings page
    When I enter "facebook.com" in the add website field
    And I tap "Add"
    Then "facebook.com" should appear in the blocked list

  Scenario: Remove a website from block list
    Given "reddit.com" is in my blocked websites list
    When I tap the X next to "reddit.com"
    Then "reddit.com" should be removed from the list

  Scenario: Invalid website domain rejected
    Given I am on the global settings page
    When I enter "not a domain" in the add website field
    And I tap "Add"
    Then I should see an error message
    And the invalid entry should not be added

  Scenario: Navigate back from settings
    Given I am on the global settings page
    When I tap the back arrow
    Then I should see the daily checklist

  Scenario: Blocked websites persist after refresh
    Given I have added "instagram.com" to my blocked websites
    When I refresh the page
    Then "instagram.com" should still be in the blocked list
