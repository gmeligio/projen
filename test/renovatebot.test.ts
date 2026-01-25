import { synthSnapshot, TestProject } from "./util";
import { DependencyType } from "../src";

describe("renovatebot", () => {
  test("renovatebot: true creates renovatebot configuration", () => {
    // GIVEN
    const p = new TestProject({
      renovatebot: true,
      renovatebotOptions: {
        labels: ["renotate", "dependencies"],
      },
    });

    // WHEN
    const snapshot = synthSnapshot(p);

    // THEN
    expect(snapshot["renovate.json5"]).toMatchSnapshot();
  });

  test("renovatebot: will ignore deps added later", () => {
    // GIVEN
    const p = new TestProject({
      renovatebot: true,
      renovatebotOptions: {
        labels: ["renotate", "dependencies"],
      },
    });
    p.deps.addDependency("test@1.0.0", DependencyType.RUNTIME);

    // WHEN
    const snapshot = synthSnapshot(p);

    // THEN
    // GitHub Actions are NOT ignored - they're managed via customManagers
    expect(snapshot["renovate.json5"]).toHaveProperty("ignoreDeps", [
      "test",
      "projen",
    ]);
  });

  test("renovatebot: GitHub Actions are managed via customManagers", () => {
    // GIVEN
    const p = new TestProject({
      renovatebot: true,
      renovatebotOptions: {
        labels: ["renotate", "dependencies"],
      },
      github: true,
      githubOptions: {
        workflows: true,
      },
    });

    // WHEN
    const snapshot = synthSnapshot(p);

    // THEN
    // GitHub Actions are NOT in ignoreDeps - they're managed via customManagers
    expect(snapshot["renovate.json5"]).toHaveProperty("ignoreDeps", ["projen"]);
    expect(snapshot["renovate.json5"]).toHaveProperty("customManagers");
  });

  test("renovatebot: reusable workflows are still ignored", () => {
    // GIVEN
    const p = new TestProject({
      renovatebot: true,
      renovatebotOptions: {
        labels: ["renotate", "dependencies"],
      },
      github: true,
      githubOptions: {
        workflows: true,
      },
    });

    const workflow = p.github?.addWorkflow("self-added");
    workflow?.addJob("actions", {
      permissions: {},
      uses: "own-org/reusable-workflows/.github/workflows/testing.yaml@v1",
    });

    // WHEN
    const snapshot = synthSnapshot(p);

    // THEN
    // Only projen is ignored - GitHub Actions are now managed via customManagers
    // Note: Reusable workflows are also no longer ignored as they can be
    // managed through .projenrc.ts if desired
    expect(snapshot["renovate.json5"]).toHaveProperty("ignoreDeps", ["projen"]);
  });

  test("renovatebot: GitHub Actions are not ignored (managed via customManagers)", () => {
    // GIVEN
    const p = new TestProject({
      renovatebot: true,
      renovatebotOptions: {
        labels: ["renotate", "dependencies"],
      },
      github: true,
      githubOptions: {
        workflows: true,
      },
    });

    const workflow = p.github?.addWorkflow("self-added");
    workflow?.addJob("actions", {
      permissions: {},
      steps: [
        {
          name: "checkout",
          uses: "actions/checkout@v4",
        },
        {
          name: "cache",
          uses: "actions/cache@v4",
        },
      ],
    });
    // WHEN
    const snapshot = synthSnapshot(p);

    // THEN
    // GitHub Actions are no longer ignored - they're managed via customManagers
    // which allows Renovate to update them in .projenrc.ts files
    expect(snapshot["renovate.json5"]).toHaveProperty("ignoreDeps", ["projen"]);
    expect(snapshot["renovate.json5"]).toHaveProperty("customManagers");
    expect(snapshot["renovate.json5"].customManagers[0]).toHaveProperty(
      "customType",
      "regex"
    );
  });

  test("renovatebot: override renovatebot configuration", () => {
    // GIVEN
    const overrideConfig = {
      prHourlyLimit: 10,
      schedule: [],
      packageRules: [],
      labels: [],
      ignoreDeps: [],
      extends: ["customExtend"],
    };
    const p = new TestProject({
      renovatebot: true,
      renovatebotOptions: {
        marker: false,
        labels: ["renotate", "dependencies"],
        overrideConfig: overrideConfig,
      },
    });

    // WHEN
    const snapshot = synthSnapshot(p)["renovate.json5"];

    // THEN
    expect(snapshot).toMatchSnapshot();
    // The customManagers for GitHub Actions is always included for Renovate
    // to support updating actions in .projenrc.ts files
    expect(snapshot).toMatchObject(overrideConfig);
    expect(snapshot).toHaveProperty("customManagers");
  });

  test("renovatebot: can use file escape hatch", () => {
    // GIVEN
    const p = new TestProject({
      renovatebot: true,
      renovatebotOptions: {
        labels: ["renotate", "dependencies"],
      },
    });

    // THEN
    expect(p.tryFindObjectFile("renovate.json5")).toBeDefined();
  });
});
