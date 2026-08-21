# @winlerr/config

Shared build configuration for the Winlerr monorepo.

- `typescript.json` — base `tsconfig` preset.
- `eslint-preset.mjs` — shared ESLint flat config preset.

Usage in a package:

```json
{
  "extends": "@winlerr/config/typescript.json"
}
```

```mjs
import preset from "@winlerr/config/eslint";
export default [...preset];
```
