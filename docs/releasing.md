# Releasing Hawtio.next packages

This document describes the release procedure for each package in Hawtio.next.

## Preliminary check

Before performing a release, first ensure that the project is ready for release by doing the following:

```console
yarn install

# lint
yarn format:check
yarn lint

# build & test
yarn build:all
yarn test:all
```

## Releasing @hawtio/react

To release the `@hawtio/react` package, follow these steps:

1. Manually increase the `version` in [packages/hawtio/package.json](../packages/hawtio/package.json). (Currently, we don't use any automation tool for increasing versions yet.)

   ```diff
    {
      "name": "@hawtio/react",
   -  "version": "0.1.0",
   +  "version": "0.2.0",
      "description": "A Hawtio reimplementation based on TypeScript + React.",
   ```

2. Commit the change and tag the version. Note we prefix `v` to a version in commit messages and tags.

   ```console
   git commit -m v0.2.0
   git tag v0.2.0
   ```

3. Check the contents to be packaged before the actual release is made with `yarn pack` command.

   ```console
   $ yarn workspace @hawtio/react pack
   $ tar -tf packages/hawtio/package.tgz
   package/LICENSE
   package/README.md
   package/dist/index.css
   package/dist/index.css.map
   package/dist/index.d.ts
   package/dist/index.js
   package/dist/index.js.map
   package/package.json
   ```

   Make sure to clean up the generated file after checking.

   ```console
   git clean -f
   ```

4. Perform the release.

   ```console
   yarn release:hawtio
   ```

## Releasing other @hawtio/\<package-name\> packages

To release a `@hawtio/<package-name>` package, follow these steps:

1. Manually increase the `version` in packages/\<package-name\>/package.json. (Currently, we don't use any automation tool for increasing versions yet.)

   ```diff
    {
      "name": "@hawtio/<package-name>",
   -  "version": "1.0.0",
   +  "version": "1.1.0",
      "description": "...",
   ```

2. Commit the change and tag the version. Note we prefix `@hawtio/<package-name> v` to a version in commit messages and `<package-name>-v` to tags, since it is monorepo and different packages coexist in the single `main` branch.

   ```console
   git commit -m '@hawtio/<package-name> v1.1.0'
   git tag <package-name>-v1.1.0
   ```

3. Check the contents to be packaged before the actual release is made with `yarn pack` command.

   ```console
   $ yarn workspace @hawtio/<package-name> pack
   $ tar -tf packages/<package-name>/package.tgz
   package/LICENSE
   package/dist/index.d.ts
   package/dist/index.js
   package/package.json
   ```

   Make sure to clean up the generated file after checking.

   ```console
   git clean -f
   ```

4. Perform the release.

   ```console
   yarn release:<package-name>
   ```
