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

## Determining the target version to release

We follow [Semantic Versioning](https://semver.org/). That means the target version to increase to should be decided automatically based on the commit history since the last release.

The criteria for determining the target version is as follows:

- If the unreleased commit history has at least one commit with `feat:`, raise the **minor** version, e.g. `0.5.0` -> `0.6.0`
- If the unreleased commit history has no commits with `feat:`, raise the **patch** version, e.g. `0.5.0` -> `0.5.1`

> [!NOTE]
> Hawtio is a web UI console, so we normally think new features to the console are backward compatible. Thus, we raise the major version only when the project reaches an important milestone, requires major upgrades of some key components such as React and PatternFly in a backward compatible way, or needs to pivot the basic conditions of the project.

## Releasing a package

To release a `@hawtio/<package-name>` package that uses [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version), follow these steps:

1. Run the following script to increase the `version` in `packages/<package-name>/package.json` (for example, [packages/hawtio/package.json](../packages/hawtio/package.json)) automatically. Since it uses `commit-and-tag-version`, the script automatically increases the version appropriately based on the commit history, creates a commit and a tag, and updates the changelog:

   ```console
   yarn release:<package-name>
   ```

2. Check that the commit and tag are made as expected:

   ```console
   git log -1
   git tag
   ```

   If not, revert the changes, fix the issue, and try the first step again.

3. Check the contents to be packaged before the actual release is made with `yarn pack` command.

   ```console
   $ yarn workspace @hawtio/<package-name> pack
   $ tar -tf packages/<package-name>/package.tgz
   package/CHANGELOG.md
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

4. Publish the release.

   ```console
   yarn publish:<package-name>
   ```

5. Push the commit and tag to the repository. The previous step doesn't automatically push changes to the repository, so don't forget to do this step.

   ```console
   git push <repo> main --tags
   ```

## Releasing a package manually

> [!IMPORTANT]
> For packages that use `commit-and-tag-version`, always follow [Releasing a package](#releasing-a-package). Manually releasing should be done only when really necessary.

To release a `@hawtio/<package-name>` package manually, follow these steps:

1. Manually increase the `version` in `packages/<package-name>/package.json`.

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

4. Publish the release.

   ```console
   yarn workspace <package-name> npm publish --tolerate-republish
   ```

5. Push the commit and tag to the repository. The previous step doesn't automatically push changes to the repository, so don't forget to do this step.

   ```console
   git push <repo> main --tags
   ```
