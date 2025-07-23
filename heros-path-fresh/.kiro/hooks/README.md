# Agent Hooks for Steering Document Management

This directory contains agent hooks that automate the maintenance of steering documents as the project evolves.

## Available Hooks

### 1. Spec Completion Checker
- **Trigger**: When tasks are marked as complete in a spec's tasks.md file
- **Action**: Checks if a task is complete, updates spec status, and updates steering documents
- **File**: `.kiro\hooks\spec-completion-tracker.kiro.hook`

## How These Hooks Work

1. **Incremental Updates**: As you complete tasks and specs, the hooks automatically update steering documents

## Customizing Hooks

To modify these hooks:
1. Edit the JSON files in this directory
2. Adjust triggers, conditions, or action prompts as needed
3. For schedule-based hooks, use standard cron syntax

## Manual Trigger

You can manually trigger these hooks through the Kiro Hook UI:
1. Open the command palette
2. Search for "Open Kiro Hook UI"
3. Select the hook you want to run
4. Click "Run Now"