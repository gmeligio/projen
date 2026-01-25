import { DependencyType } from "../../src/dependencies";
import { GitHubActionsProvider } from "../../src/github/actions-provider";
import { TestProject } from "../util";

const validCommit = "11bd71901bbe5b1630ceea73d27597364c9af683";
const anotherValidCommit = "cdca7365b2dadb8aad0a33bc7601856ffabcc48e";

describe("GitHubActionsProvider", () => {
  describe("addActions", () => {
    test("adds action with valid commit SHA", () => {
      const project = new TestProject();
      const actions = new GitHubActionsProvider(project);

      actions.addActions(`actions/checkout@${validCommit}`);

      const dep = project.deps.tryGetDependency(
        "actions/checkout",
        DependencyType.GITHUB_ACTION
      );
      expect(dep).toBeDefined();
      expect(dep?.version).toBe(validCommit);
    });

    test("adds action with optional tag", () => {
      const project = new TestProject();
      const actions = new GitHubActionsProvider(project);

      actions.addActions({
        coordinate: `actions/checkout@${validCommit}`,
        tag: "v5",
      });

      const dep = project.deps.tryGetDependency(
        "actions/checkout",
        DependencyType.GITHUB_ACTION
      );
      expect(dep).toBeDefined();
      expect(dep?.version).toBe(validCommit);
      expect(dep?.metadata?.tag).toBe("v5");
    });

    test("adds multiple actions at once", () => {
      const project = new TestProject();
      const actions = new GitHubActionsProvider(project);

      actions.addActions(`actions/checkout@${validCommit}`, {
        coordinate: `actions/setup-node@${anotherValidCommit}`,
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
      expect(checkout?.version).toBe(validCommit);
      expect(setupNode?.version).toBe(anotherValidCommit);
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

      actions.set("actions/checkout", `actions/checkout@${validCommit}`, "v5");

      expect(actions.get("actions/checkout")).toBe(
        `actions/checkout@${validCommit}`
      );
      expect(actions.get("actions/checkout@v4")).toBe(
        `actions/checkout@${validCommit}`
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

      actions.set("actions/checkout", `actions/checkout@${validCommit}`);

      expect(actions.get("actions/checkout@v4")).toBe(
        `actions/checkout@${validCommit}`
      );
    });

    test("returns registered dependency", () => {
      const project = new TestProject();
      const actions = new GitHubActionsProvider(project);

      actions.addActions(`actions/checkout@${validCommit}`);

      expect(actions.get("actions/checkout")).toBe(
        `actions/checkout@${validCommit}`
      );
    });

    test("auto-registers valid action@commit and returns it", () => {
      const project = new TestProject();
      const actions = new GitHubActionsProvider(project);

      const result = actions.get(`actions/checkout@${validCommit}`);

      expect(result).toBe(`actions/checkout@${validCommit}`);

      // Should be registered as a dependency now
      const dep = project.deps.tryGetDependency(
        "actions/checkout",
        DependencyType.GITHUB_ACTION
      );
      expect(dep).toBeDefined();
      expect(dep?.version).toBe(validCommit);
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
        coordinate: `actions/checkout@${validCommit}`,
        tag: "v5",
      });

      expect(actions.getTag("actions/checkout")).toBe("v5");
    });

    test("returns tag from override", () => {
      const project = new TestProject();
      const actions = new GitHubActionsProvider(project);

      actions.set("actions/checkout", `actions/checkout@${validCommit}`, "v5");

      expect(actions.getTag("actions/checkout")).toBe("v5");
    });

    test("returns undefined when no tag is set", () => {
      const project = new TestProject();
      const actions = new GitHubActionsProvider(project);

      actions.addActions(`actions/checkout@${validCommit}`);

      expect(actions.getTag("actions/checkout")).toBeUndefined();
    });
  });
});
