## Code Formatting

- Use blank lines to separate code sections.
- Each function must start and end with a blank line.
- If an if/else statement has only one line, braces must not be used.

## Git

- The commit message will be shown twice, in Spanish and in English.
- When writing a commit message, it must start with an action (add, remove, fix, etc.) followed by a brief description of the modification in natural language. Subsequently, list the modified files and a brief description of the modification in technical language.
- The name of the modified file will be `filename.extension`.
- Create the message in "code block" format, with monospace font and a copy button.
- Create a "block of code" for each language.
- This would be an example of a commit message:

```
add new functionality to filter ads

- show-ads.components.ts: Add input text element to filter by text.
- ad.service.ts: Create new method to filter by text.
```

- By default, always write the commit message based on the files marked as `staged`, and if there are none, based on the modified files.
- When creating a commit message, show only the message and not the command to create the commit.
