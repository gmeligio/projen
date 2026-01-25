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


# Pull Request/Issue Description


## Background

Related PRs:
- Inspiration: https://github.com/projen/projen/pull/1891
- Override PR: https://github.com/projen/projen/pull/2439
- Ignore actions from renovate: https://github.com/projen/projen/pull/4342

Related issues:
- Customize version: https://github.com/projen/projen/issues/1844
- Pin SHA: https://github.com/projen/projen/issues/1702
- Renovate: https://github.com/projen/projen/issues/4331

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
2. Is having actions-up in the upgrade task a good idea?
3. Would it be useful if `uses:` also supports passing the `tag` as a parameter?
