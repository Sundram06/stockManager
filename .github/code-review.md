---
name: code-review
description: Code review a pull request with high-signal feedback
---

# Code Review Command

Perform automated code review on pull requests or code changes.

## Review Process

1. **Check Prerequisites**:
   - Is the pull request open and ready for review?
   - Is this a meaningful change that needs review?
   - Has this already been reviewed?

2. **Gather Context**:
   - Review PR title and description
   - Understand the author's intent
   - Check for relevant guidelines or documentation

3. **Analyze Changes**:
   - Scan for obvious bugs and logic errors
   - Check for security issues
   - Validate compliance with project guidelines
   - Review for syntax errors, type errors, missing imports

4. **Focus on HIGH SIGNAL Issues**:
   - Code that will fail to compile or parse
   - Clear logic errors producing wrong results
   - Security vulnerabilities
   - Unambiguous guideline violations

5. **Do NOT Flag**:
   - Code style or quality concerns
   - Pedantic nitpicks
   - Issues that linters will catch
   - Pre-existing issues not in the current changes
   - Subjective suggestions

## Output Format

When providing code review feedback:

- Link directly to specific lines with context
- For small fixes (< 6 lines): Provide committable suggestion
- For larger fixes: Describe the issue and suggested approach
- Always cite relevant documentation or guidelines
- Include confidence level for each issue

## Review Quality Standards

**CRITICAL**: Only flag issues with high confidence. False positives erode trust.

Valid issues to flag:

- Syntax errors, type errors, missing imports
- Logic errors that will produce incorrect results
- Security vulnerabilities in the changes
- Clear violations of documented guidelines

Invalid flags:

- Style preferences
- Potential issues depending on specific inputs
- General quality suggestions
- Issues already noted in code comments (e.g., lint ignores)
