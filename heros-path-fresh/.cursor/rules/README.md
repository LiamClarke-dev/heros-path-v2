# Hero's Path - Cursor Rules

This directory contains Cursor rules that provide guidance for developing the Hero's Path application. These rules are based on the Kiro steering documents and ensure consistent development practices across the project.

## Available Rules

### 1. [cursor_rules.mdc](cursor_rules.mdc)
- Guidelines for creating and maintaining Cursor rules
- Rule structure and formatting requirements
- Best practices for rule documentation

### 2. [project_structure.mdc](project_structure.mdc)
- Directory organization and file naming conventions
- Component, service, and context organization patterns
- Import organization and state management hierarchy
- Navigation structure guidelines

### 3. [development_workflow.mdc](development_workflow.mdc)
- Branch strategy and naming conventions
- Commit message format and types
- Pull request process and code review guidelines
- Build process and environment management
- Security and testing requirements

### 4. [technical_patterns.mdc](technical_patterns.mdc)
- Tech stack requirements and architecture patterns
- Component, context, and service layer patterns
- Error handling, logging, and theme integration
- API integration, location services, and Firebase patterns
- Performance optimization and animation guidelines

### 5. [product_features.mdc](product_features.mdc)
- Core product vision and target user personas
- Feature prioritization tiers (Tier 1-4)
- Implementation guidelines for core features
- User experience and gamification guidelines
- Quality assurance and testing requirements

### 6. [self_improve.mdc](self_improve.mdc)
- Guidelines for continuously improving Cursor rules
- Rule improvement triggers and analysis process
- Rule quality checks and maintenance procedures

## How to Use These Rules

### For Developers
1. **Follow the Rules**: These rules are automatically applied when `alwaysApply: true`
2. **Reference Patterns**: Use the code examples as templates for new implementations
3. **Maintain Consistency**: Follow the established patterns for naming, structure, and architecture
4. **Update Rules**: When new patterns emerge, update the relevant rules

### For AI Assistants
1. **Apply Rules**: Use these rules to guide code generation and suggestions
2. **Follow Patterns**: Implement features using the established patterns and examples
3. **Maintain Quality**: Ensure all code follows the technical and architectural guidelines
4. **Improve Rules**: Identify new patterns and suggest rule updates

## Rule Categories

### Structure & Organization
- File and directory naming conventions
- Component and service organization
- Import organization and state management
- Navigation structure

### Development Process
- Branch strategy and workflow
- Commit conventions and PR process
- Testing and quality assurance
- Build and deployment process

### Technical Implementation
- Architecture patterns and best practices
- Error handling and logging
- Performance optimization
- Security guidelines

### Product Features
- Feature prioritization and implementation
- User experience guidelines
- Gamification elements
- Quality assurance requirements

## Rule Maintenance

### When to Update Rules
- New code patterns emerge in 3+ files
- Common bugs could be prevented by rules
- Code reviews repeatedly mention the same feedback
- New security or performance patterns emerge
- Implementation details change

### How to Update Rules
1. Follow the structure in [cursor_rules.mdc](cursor_rules.mdc)
2. Include specific, actionable requirements
3. Show examples from actual codebase
4. Reference existing code when possible
5. Cross-reference related rules

### Rule Quality Checks
- Rules should be actionable and specific
- Examples should come from actual code
- References should be up to date
- Patterns should be consistently enforced

## Integration with Kiro Steering

These Cursor rules are derived from the Kiro steering documents:
- [Product Overview](../.kiro/steering/product.md)
- [Technical Overview](../.kiro/steering/tech.md)
- [Project Structure](../.kiro/steering/structure.md)
- [GitHub Workflow](../.kiro/steering/github.md)

The rules maintain consistency with the steering documents while providing specific, actionable guidance for development.

## Best Practices

1. **Consistency**: Follow established patterns across the codebase
2. **Quality**: Maintain high code quality and performance standards
3. **Documentation**: Keep rules updated with new patterns and examples
4. **Collaboration**: Share rule improvements with the team
5. **Automation**: Use rules to automate code quality checks

## Support

For questions about these rules or suggestions for improvements:
1. Review the existing rules for guidance
2. Check the Kiro steering documents for context
3. Propose updates through the established workflow
4. Maintain consistency with the overall project vision 