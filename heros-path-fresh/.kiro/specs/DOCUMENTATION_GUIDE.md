# Hero's Path - Documentation Guide

## Overview

This guide explains the documentation structure for the Hero's Path application. We've implemented a structured specification system that provides comprehensive documentation for each feature, organized by priority tiers and aligned with the project's steering files.

## Documentation Structure

```
.kiro/
├── specs/                     # Feature specifications
│   ├── README.md              # Master index of all specifications
│   ├── FEATURE_MAP.md         # Visual overview of features and relationships
│   ├── DOCUMENTATION_GUIDE.md # This guide
│   ├── NEXT_STEPS.md          # Documentation roadmap
│   ├── analysis/              # Analysis documents
│   │   ├── DEPENDENCY_ANALYSIS.md
│   │   └── REPRIORITIZATION_ASSESSMENT.md
│   ├── templates/             # Templates for creating new specs
│   │   ├── requirements-template.md
│   │   ├── design-template.md
│   │   ├── tasks-template.md
│   │   └── metadata-template.json
│   ├── tier-1-critical/       # Tier 1 (Critical) features
│   ├── tier-2-important/      # Tier 2 (Important) features
│   ├── tier-3-enhancement/    # Tier 3 (Enhancement) features
│   └── tier-4-advanced/       # Tier 4 (Advanced) features
└── steering/                  # High-level context documents
    ├── product.md             # Product overview
    ├── tech.md                # Technical overview
    └── structure.md           # Project structure
```

## Specification Format

Each feature has its own directory containing three standardized documents:

1. **Requirements Document** (`requirements.md`)
   - Introduction and overview
   - User stories with acceptance criteria in EARS format
   - Edge cases and constraints
   - Business rules

2. **Design Document** (`design.md`)
   - Architecture and system design
   - Component interfaces
   - Data models
   - Error handling
   - Testing strategy
   - Performance considerations

3. **Tasks Document** (`tasks.md`)
   - Implementation tasks with references to requirements
   - Testing tasks
   - Integration points

## Relationship with Steering Files

The specification system works in conjunction with the steering files:

- **Steering Files** (`.kiro/steering/`): Provide high-level context about the product, technology, and structure for both AI assistants and developers
- **Specification Files** (`.kiro/specs/`): Provide detailed specifications for features and implementation guidance

When creating or updating specs, ensure they align with the principles and guidelines in the steering files.

## How to Use This Documentation

### For New Developers

1. Start with the steering files to understand the overall project context
2. Review the [README.md](./) for an overview of all features
3. Explore the [FEATURE_MAP.md](./FEATURE_MAP.md) to understand feature relationships and dependencies
4. Follow the recommended development sequence in FEATURE_MAP.md
5. Explore Tier 1 features first to understand core functionality
6. Use the specs as a reference when working on specific features

### For Feature Development

1. Check if a spec already exists for the feature
2. Review the dependency analysis to understand how the feature relates to others
3. If creating a new feature, use the templates in the `templates/` directory
4. Ensure the feature includes necessary extension points for higher-tier features
5. Update the spec if implementation details change

### For Bug Fixes

1. Locate the spec for the affected feature
2. Review the requirements and design to understand intended behavior
3. Update the spec if the fix changes the feature's behavior or design
4. Ensure the fix maintains compatibility with dependent features

## Creating New Specifications

1. Create a new directory for the feature in the appropriate tier
2. Copy the template files from `templates/` to the new directory
3. Rename the files to `requirements.md`, `design.md`, and `tasks.md`
4. Fill in the templates with feature-specific information
5. Update the README.md and FEATURE_MAP.md to include the new feature
6. Verify consistency with steering files

## Maintaining Cross-Tier Consistency

1. **Extension Points**: Ensure lower-tier features include extension points needed by higher-tier features
2. **Terminology**: Use consistent terminology across all specs (see DEPENDENCY_ANALYSIS.md)
3. **Dependencies**: Clearly document dependencies between features
4. **Versioning**: Track feature versions and compatibility requirements
5. **Testing**: Include testing strategies that verify integration with dependent features

## Handling Feature Reprioritization

When a feature needs to be reprioritized:

1. Update the feature's location in the directory structure
2. Update README.md and FEATURE_MAP.md to reflect the new priority
3. Review and update dependencies in affected features
4. Consider phased implementation for complex features (see REPRIORITIZATION_ASSESSMENT.md)

## Maintaining Specifications

1. Keep specs in sync with implementation
2. Update specs when features change
3. Archive outdated specs rather than deleting them
4. Review and update specs during code reviews
5. Regularly verify consistency with steering files

## Relationship to Legacy Documentation

The previous documentation has been archived in `docs/ARCHIVE/`. The new specification system replaces and expands upon this documentation, providing more structured and comprehensive information about each feature.

## Questions and Support

If you have questions about the documentation structure or need help creating or updating specs, please contact the development team lead.