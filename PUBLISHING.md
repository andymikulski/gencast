# Publishing Guide

This document outlines the steps to publish GenCast to npm.

## Prerequisites

1. **npm account**: Create an account at [npmjs.com](https://www.npmjs.com/)
2. **npm login**: Run `npm login` and enter your credentials

## Pre-publish Checklist

- [ ] Update version in `package.json` (follow [semver](https://semver.org/))
- [ ] Update `CHANGELOG.md` with release notes (create if needed)
- [ ] Ensure all tests pass: `npm test`
- [ ] Build the package: `npm run build`
- [ ] Verify dist/ folder contains all necessary files
- [ ] Check package.json metadata (name, description, keywords, repository, author)
- [ ] Verify LICENSE file is present
- [ ] Update README.md if needed

## Publishing Steps

### 1. Dry Run (Optional but Recommended)

See what files will be published without actually publishing:

```bash
npm pack --dry-run
```

Or create a tarball to inspect:

```bash
npm pack
# This creates gencast-1.0.0.tgz
tar -tzf gencast-1.0.0.tgz
```

### 2. Test Locally

Install the package locally in another project to test:

```bash
# In another test project
npm install /path/to/gencast

# Or using the tarball
npm install /path/to/gencast-1.0.0.tgz
```

### 3. Publish to npm

```bash
# Login if not already logged in
npm login

# Publish (the prepublishOnly script will run build automatically)
npm publish
```

For scoped packages (e.g., `@yourusername/gencast`):

```bash
# Public scoped package
npm publish --access public

# Private scoped package (requires paid npm account)
npm publish
```

### 4. Verify

Check that your package is available:

```bash
npm info gencast
```

Visit: https://www.npmjs.com/package/gencast

### 5. Test Installation

In a fresh project:

```bash
npm install gencast
npx gencast
```

## Version Management

Follow semantic versioning:

- **MAJOR** (1.0.0 → 2.0.0): Breaking changes
- **MINOR** (1.0.0 → 1.1.0): New features, backwards compatible
- **PATCH** (1.0.0 → 1.0.1): Bug fixes, backwards compatible

Update version:

```bash
# Patch release (1.0.0 → 1.0.1)
npm version patch

# Minor release (1.0.0 → 1.1.0)
npm version minor

# Major release (1.0.0 → 2.0.0)
npm version major
```

This will:
1. Update `package.json` version
2. Create a git commit
3. Create a git tag

Then publish:

```bash
npm publish
git push && git push --tags
```

## Updating an Existing Package

1. Make your changes
2. Update version: `npm version [patch|minor|major]`
3. Build: `npm run build`
4. Publish: `npm publish`
5. Push git changes: `git push && git push --tags`

## Unpublishing (Use with Caution!)

You can only unpublish within 72 hours of publishing:

```bash
# Unpublish a specific version
npm unpublish gencast@1.0.0

# Unpublish entire package (dangerous!)
npm unpublish gencast --force
```

**Note**: Unpublishing is generally discouraged. Consider deprecating instead:

```bash
npm deprecate gencast@1.0.0 "Please upgrade to 1.0.1 - fixes critical bug"
```

## Package Metadata to Update

Before your first publish, update these fields in `package.json`:

```json
{
  "name": "gencast",
  "version": "1.0.0",
  "description": "Runtime type casting for TypeScript interfaces using duck typing",
  "author": "Your Name <your.email@example.com>",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/gencast"
  },
  "keywords": [
    "typescript",
    "runtime",
    "type-checking",
    "casting",
    "duck-typing",
    "validation",
    "codegen",
    "interface"
  ],
  "bugs": {
    "url": "https://github.com/yourusername/gencast/issues"
  },
  "homepage": "https://github.com/yourusername/gencast#readme"
}
```

## Troubleshooting

### "Package name already exists"

The package name is taken. Either:
- Choose a different name
- Use a scoped package: `@yourusername/gencast`

### "You must be logged in to publish"

Run `npm login` first.

### "You do not have permission to publish"

- Check if you own the package
- For scoped packages, use `--access public`

### Build errors before publish

The `prepublishOnly` script runs `npm run build`. Fix any TypeScript errors before publishing.

## Best Practices

1. **Always test locally first** using `npm link` or `npm pack`
2. **Use semantic versioning** consistently
3. **Keep a CHANGELOG.md** to track changes
4. **Tag releases in git** for easy rollback
5. **Don't unpublish** unless absolutely necessary
6. **Document breaking changes** clearly in README and changelog
7. **Test in a fresh project** before publishing major versions

## CI/CD Publishing (Optional)

For automated publishing via GitHub Actions, create `.github/workflows/publish.yml`:

```yaml
name: Publish to npm

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm test
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Add your npm token as a GitHub secret: `NPM_TOKEN`
