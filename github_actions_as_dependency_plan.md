The code is a bit convoluted. It needs to be cleaned up a bit.

# Refactor

1. the github actions should be added and retrieved like any other action.
2. the tracking mechanism using `trackUsedAction` and `usedActions`seems like a workaround, it should be refactor to something similar to NodeJS dependencies
3. the DEFAULT_ACTIONS object is a mess. The default action should be registered like any other NodeJS package right at the moment where it's needed, not in some centralised file. projen favors isolating by specific tool, so centralising all github actions doesn't make sense. Each github action corresponds to a given tool or task, so it should be added like project.deps.add or similar at the time is used.
4. There could be a helper either in the Dependencies class or in other place that makes sense to get a Github Action in the format that's expected for a `step.uses`. Then the action name doesn't need to be repeated twice like in
```
uses: `actions/download-artifact@${DEFAULT_ACTIONS["actions/download-artifact"].tag}`,
```
1. The GitHubActionsProvider should be refactor to use Dependencies functions without little to none logic of its own, so it will be more a bare-bone class for backward-compatibility.


# TODO before opening the PR

1. Add a manifest file to actions-up, equivalent to package.json in NodeJS, and remove the version handling from projen. Instead, the implementation would be similar to NodePackage.
1. Add the possibility for the user to specify dependencies in the `.projenrc.ts` file, within the `githubActionsDeps` field.
1. Test that dependencies are added correctly. Even in the scenario, where the action is directly set in `uses:` by the user, where it should be auto-added and shown in deps.json.
  - Add unit tests to Dependencies class.
  - Add snapshot test to deps.json.
1. Use actions-up in interactive mode to avoid breaking changes. If added, add this to the benefits list.
1. Figure out better the integration with renovate. It should be composable, not all or nothing. The new actions as dependencies is independet from using renovate or not.
1. Make a excalidraw diagram on how a Github Action is resolved.
1. Make a excalidraw diagram on the multiple ways a Github Action can be added.
1. Make a excalidraw diagram on the multiple ways a Github Action can be overriden.

# Pull Request/Issue Description

## Background

Related PRs:
- Initial Inspiration: https://github.com/projen/projen/pull/1891
- Adding support for overrides: https://github.com/projen/projen/pull/2439
- Ignore actions from renovate: https://github.com/projen/projen/pull/4342

Related issues:
- Customize version: https://github.com/projen/projen/issues/1844
- Pin SHA: https://github.com/projen/projen/issues/1702
- Renovate: https://github.com/projen/projen/issues/4331

## Benefits

- Uses commit SHA instead of mutable tags to:
    - Prevent supply chain attacks
    - Ensure reproducibility
- YAML version comment: Adds the tag next to the pinned SHA for readability

## Breaking changes

1. The workflow file will always use the format `namespace/action@commit`.
1. actions.get will always return the action in the format `namespace/action@commit`. It will error if not found in a valid format, i.e `actions/checkout@v5`.
1. The `GitHubActionsProvider` constructor now requires a `Project` instance.

## Open Questions for the PR reviewer

1. Does it make sense that the `project` is part of the `GitHubActionsProvider` constructor?
```
export class GitHubActionsProvider {
  private readonly project: Project;
  private overrides = new Map<string, { reference: string; tag?: string }>();

  constructor(project: Project) {
    this.project = project;
  }
}
```
1. Should `GitHubActionsProvider` extend from Component?
1. Is having actions-up in the upgrade task a good idea?
1. Would it be useful if `uses:` also supports passing the `tag` as a parameter?
1. Should actions.get() be allowed to pass either the `namespace/action@commit` or `namespace/action@tag`? Or just the `namespace/action@commit` to have consistent validation across all the action dependency logic?
