import { DependencyType } from "../../src/dependencies";
import { GitHubActionsProvider } from "../../src/github/actions-provider";
import { TestProject } from "../util";

const commit1 = "11bd71901bbe5b1630ceea73d27597364c9af683";
const commit2 = "cdca7365b2dadb8aad0a33bc7601856ffabcc48e";

describe("GitHubActionsProvider", () => {
  describe("addActions", () => {
    test("adds action with valid commit SHA", () => {
      const project = new TestProject();
      const actions = new GitHubActionsProvider(project);

      actions.addActions(`actions/checkout@${commit1}`);

      const dep = project.deps.tryGetDependency(
        "actions/checkout",
        DependencyType.GITHUB_ACTION
      );
      expect(dep).toBeDefined();
      expect(dep?.version).toBe(commit1);
    });

    test("adds action with optional tag", () => {
      const project = new TestProject();
      const actions = new GitHubActionsProvider(project);

      actions.addActions({
        coordinate: `actions/checkout@${commit1}`,
        tag: "v5",
      });

      const dep = project.deps.tryGetDependency(
        "actions/checkout",
        DependencyType.GITHUB_ACTION
      );
      expect(dep).toBeDefined();
      expect(dep?.version).toBe(commit1);
      expect(dep?.metadata?.tag).toBe("v5");
    });

    test("adds multiple actions at once", () => {
      const project = new TestProject();
      const actions = new GitHubActionsProvider(project);

      actions.addActions(`actions/checkout@${commit1}`, {
        coordinate: `actions/setup-node@${commit2}`,
        tag: "v5",
      });

      const checkout = project.deps.tryGetDependency(
        "actions/checkout",
        DependencyType.GITHUB_ACTION
      );
      const setupNode = project.deps.tryGetDependency(
        "actions/setup-node",
        DependencyType.GITHUB_ACTION
      );

      expect(checkout).toBeDefined();
      expect(setupNode).toBeDefined();
      expect(checkout?.version).toBe(commit1);
      expect(setupNode?.version).toBe(commit2);
    });

    test("throws error for action without commit SHA", () => {
      const project = new TestProject();
      const actions = new GitHubActionsProvider(project);

      expect(() => {
        actions.addActions("actions/checkout");
      }).toThrow(/Expected "namespace\/action@commit"/);
    });

    test("throws error for action with tag instead of commit SHA", () => {
      const project = new TestProject();
      const actions = new GitHubActionsProvider(project);

      expect(() => {
        actions.addActions("actions/checkout@v5");
      }).toThrow(/Expected a 40-character hexadecimal SHA/);
    });

    test("throws error for action with short SHA", () => {
      const project = new TestProject();
      const actions = new GitHubActionsProvider(project);

      expect(() => {
        actions.addActions("actions/checkout@11bd719");
      }).toThrow(/Expected a 40-character hexadecimal SHA/);
    });
  });

  describe("set", () => {
    test("overrides action reference", () => {
      const project = new TestProject();
      const actions = new GitHubActionsProvider(project);

      actions.set("actions/checkout", `actions/checkout@${commit1}`, "v5");

      expect(actions.get("actions/checkout")).toBe(
        `actions/checkout@${commit1}`
      );
      expect(actions.get("actions/checkout@v4")).toBe(
        `actions/checkout@${commit1}`
      );
    });

    test("throws error for invalid override format", () => {
      const project = new TestProject();
      const actions = new GitHubActionsProvider(project);

      expect(() => {
        actions.set("actions/checkout", "actions/checkout@v5");
      }).toThrow(/Expected a 40-character hexadecimal SHA/);
    });
  });

  describe("get", () => {
    test("returns override if set", () => {
      const project = new TestProject();
      const actions = new GitHubActionsProvider(project);

      actions.set("actions/checkout", `actions/checkout@${commit1}`);

      expect(actions.get("actions/checkout@v4")).toBe(
        `actions/checkout@${commit1}`
      );
    });

    test("returns registered dependency", () => {
      const project = new TestProject();
      const actions = new GitHubActionsProvider(project);

      actions.addActions(`actions/checkout@${commit1}`);

      expect(actions.get("actions/checkout")).toBe(
        `actions/checkout@${commit1}`
      );
    });

    test("auto-registers valid action@commit and returns it", () => {
      const project = new TestProject();
      const actions = new GitHubActionsProvider(project);

      const result = actions.get(`actions/checkout@${commit1}`);

      expect(result).toBe(`actions/checkout@${commit1}`);

      // Should be registered as a dependency now
      const dep = project.deps.tryGetDependency(
        "actions/checkout",
        DependencyType.GITHUB_ACTION
      );
      expect(dep).toBeDefined();
      expect(dep?.version).toBe(commit1);
    });

    test("passes through legacy tag-based references", () => {
      const project = new TestProject();
      const actions = new GitHubActionsProvider(project);

      // Legacy format should pass through unchanged for unregistered actions
      expect(actions.get("actions/cache@v3")).toBe("actions/cache@v3");
    });

    test("passes through unknown actions", () => {
      const project = new TestProject();
      const actions = new GitHubActionsProvider(project);

      expect(actions.get("unknown/action")).toBe("unknown/action");
    });
  });

  describe("getTag", () => {
    test("returns tag from registered action", () => {
      const project = new TestProject();
      const actions = new GitHubActionsProvider(project);

      actions.addActions({
        coordinate: `actions/checkout@${commit1}`,
        tag: "v5",
      });

      expect(actions.getTag("actions/checkout")).toBe("v5");
    });

    test("returns tag from override", () => {
      const project = new TestProject();
      const actions = new GitHubActionsProvider(project);

      actions.set("actions/checkout", `actions/checkout@${commit1}`, "v5");

      expect(actions.getTag("actions/checkout")).toBe("v5");
    });

    test("returns undefined when no tag is set", () => {
      const project = new TestProject();
      const actions = new GitHubActionsProvider(project);

      actions.addActions(`actions/checkout@${commit1}`);

      expect(actions.getTag("actions/checkout")).toBeUndefined();
    });
  });
});
