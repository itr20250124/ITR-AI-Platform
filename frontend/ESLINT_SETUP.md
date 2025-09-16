# ESLint Configuration for React Best Practices

This project uses a comprehensive ESLint configuration that enforces React best practices, TypeScript standards, and accessibility guidelines.

## Installed Packages

### Core ESLint Packages
- `eslint` - Core ESLint linter
- `@typescript-eslint/eslint-plugin` - TypeScript-specific linting rules
- `@typescript-eslint/parser` - TypeScript parser for ESLint

### React-Specific Packages
- `eslint-plugin-react` - React-specific linting rules
- `eslint-plugin-react-hooks` - Rules for React Hooks
- `eslint-plugin-react-refresh` - Rules for React Fast Refresh

### Accessibility & Import Management
- `eslint-plugin-jsx-a11y` - Accessibility rules for JSX
- `eslint-plugin-import` - Import/export syntax validation

### Code Formatting
- `prettier` - Code formatter
- `eslint-config-prettier` - Disables ESLint rules that conflict with Prettier
- `eslint-plugin-prettier` - Runs Prettier as an ESLint rule

## Key Rules Enforced

### React Best Practices
- ✅ Proper JSX syntax and formatting
- ✅ React Hooks rules compliance
- ✅ Component naming conventions (PascalCase)
- ✅ Self-closing components when appropriate
- ✅ Fragment syntax preference
- ✅ No useless fragments
- ✅ Proper prop handling

### Accessibility (a11y)
- ✅ Alt text for images
- ✅ Proper ARIA attributes
- ✅ Keyboard navigation support
- ✅ Semantic HTML usage
- ✅ Focus management
- ✅ Screen reader compatibility

### TypeScript Standards
- ✅ Type imports preference
- ✅ Unused variable detection
- ✅ Nullish coalescing
- ✅ Optional chaining
- ✅ Consistent type usage

### Import Organization
- ✅ Alphabetical import ordering
- ✅ Grouped imports (builtin, external, internal)
- ✅ No duplicate imports
- ✅ Proper import resolution

### Code Quality
- ✅ No console.log in production
- ✅ No debugger statements
- ✅ Consistent code formatting
- ✅ Maximum line length (100 characters)
- ✅ Proper indentation (2 spaces)

## Available Scripts

```bash
# Run ESLint to check for issues
npm run lint

# Run ESLint and automatically fix issues
npm run lint:fix

# Format code with Prettier
npm run format

# Check if code is properly formatted
npm run format:check
```

## VS Code Integration

The configuration includes VS Code settings that:
- Format code on save
- Fix ESLint issues on save
- Organize imports automatically
- Provide proper TypeScript support

## Configuration Files

- `.eslintrc.json` - Main ESLint configuration
- `.eslintignore` - Files to ignore during linting
- `.prettierrc` - Prettier formatting rules
- `.prettierignore` - Files to ignore during formatting
- `.vscode/settings.json` - VS Code editor settings

## Customization

You can customize the rules by modifying `.eslintrc.json`. Common customizations:

```json
{
  "rules": {
    // Disable a rule
    "react/prop-types": "off",
    
    // Change rule severity
    "no-console": "error",
    
    // Configure rule options
    "max-len": ["error", { "code": 120 }]
  }
}
```

## Troubleshooting

### Common Issues

1. **Import resolution errors**: Make sure `tsconfig.json` paths are correctly configured
2. **Prettier conflicts**: The configuration should handle this automatically
3. **Performance issues**: Consider using `.eslintignore` to exclude large directories

### Installing Dependencies

After cloning the project, install the ESLint dependencies:

```bash
npm install
```

The configuration will work immediately after installation.