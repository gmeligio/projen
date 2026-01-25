import { DependencyType } from "../dependencies";
import type { Project } from "../project";
import { validCommit as isValidCommit } from "./private/util";

/**
 * Action specification for explicit version control.
 */
export interface ActionSpec {
  /**
   * Action coordinate in format "namespace/action@commit".
   * The commit must be a 40-character hex SHA.
   */
  readonly coordinate: string;
  /**
   * Optional human-readable version tag for YAML comments (e.g., "v5").
   * If not provided, no comment will be added to the workflow YAML.
   */
  readonly tag?: string;
}

/**
 * Manage the versions used for GitHub Actions in workflows.
 *
 * Similar to NodePackage for npm dependencies, this class provides
 * convenience methods for adding and resolving GitHub Actions
 * while delegating storage to the project's Dependencies component.
 *
 * Actions are tracked as dependencies with type GITHUB_ACTION in deps.json.
 * The version field contains the commit SHA for pinning, and the tag
 * is stored in metadata.tag for human readability.
 */
export class GitHubActionsProvider {
  private readonly project: Project;
  private overrides = new Map<string, { coordinate: string; tag?: string }>();

  constructor(project: Project) {
    this.project = project;
  }

  /**
   * Add GitHub Actions as dependencies.
   *
   * Actions must include a commit SHA for security and reproducibility.
   * The format is "namespace/action@commit" where commit is a 40-char hex SHA.
   *
   * @param actions Action specifications (string or object with optional tag)
   *
   * @example
   * // String format - commit only (no YAML comment)
   * github.actions.addActions(
   *   "actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683"
   * );
   *
   * // Object format - with optional tag for YAML comment
   * github.actions.addActions({
   *   name: "actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683",
   *   tag: "v5"
   * });
   *
   * // Mixed - multiple actions at once
   * github.actions.addActions(
   *   "actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683",
   *   { name: "actions/setup-node@cdca7365b2dadb8aad0a33bc7601856ffabcc48e", tag: "v5" }
   * );
   */
  public addActions(...actions: Array<string | ActionSpec>): void {
    for (const action of actions) {
      if (typeof action === "string") {
        this.addActionFromString(action);
      } else {
        this.addActionFromSpec(action);
      }
    }
  }

  private addActionFromString(action: string): void {
    const { name, commit } = this.parseActionCoordinate(action);
    this.addAction(name, commit);
  }

  private addActionFromSpec(spec: ActionSpec): void {
    const { name, commit } = this.parseActionCoordinate(spec.coordinate);
    this.addAction(name, commit, spec.tag);
  }

  /**
   * Parse action coordinate and validate format.
   * @param action The action coordinate to parse
   * @param requireCommit If true, validates that the version is a 40-char SHA
   * @throws Error if format is invalid (missing commit or invalid SHA when required)
   */
  private parseActionCoordinate(
    action: string,
    requireCommit: boolean = true
  ): { name: string; commit: string } {
    const atIndex = action.lastIndexOf("@");
    if (atIndex === -1) {
      throw new Error(
        `Invalid action format: "${action}". Expected "namespace/action@commit" where commit is a 40-character SHA.`
      );
    }

    const name = action.substring(0, atIndex);
    const commit = action.substring(atIndex + 1);

    if (requireCommit && !isValidCommit(commit)) {
      throw new Error(
        `Invalid action commit: "${commit}" in "${action}". Expected a 40-character hexadecimal SHA, not a tag or branch. You can get the commit SHA from https://github.com/${action}/tags`
      );
    }

    return { name, commit };
  }

  private addAction(name: string, commit: string, tag?: string): void {
    this.project.logger.debug(
      `github-action ${name}@${commit}${tag ? ` # ${tag}` : ""}`
    );

    const metadata = tag ? { tag } : {};
    this.project.deps.addDependency(
      `${name}@${commit}`,
      DependencyType.GITHUB_ACTION,
      metadata
    );
  }

  /**
   * Define an override for a given action.
   *
   * This method allows you to replace specific action versions or all versions of an action
   * with a different commit. This is useful when:
   * - An action has breaking changes between major versions
   * - You need to pin to a specific commit for security/stability
   * - You want to use a fork or alternative action
   *
   * **Override Resolution Priority:**
   * 1. Exact version override (e.g., "actions/checkout@v4")
   * 2. General action override (e.g., "actions/checkout")
   * 3. Add dependency
   * 4. Passthrough for legacy formats
   *
   * **Security Note:** The override coordinate must include a commit SHA, not a tag.
   * This ensures reproducibility and security even when overriding actions.
   *
   * @param action The action to override. Can be:
   *   - Action name only: "actions/checkout" (overrides all versions)
   *   - Action with version: "actions/checkout@v4" (overrides only that version)
   * @param override The replacement coordinate in format "namespace/action@commit"
   *   where commit is a 40-character SHA
   * @param tag Optional human-readable tag for YAML comments (e.g., "v5-custom")
   *
   * @example
   * // Override ALL uses of checkout with a specific commit
   * project.github.actions.set(
   *   "actions/checkout",
   *   "actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683",
   *   "v5"
   * );
   *
   * // Override ONLY checkout@v2 with a different commit (useful for breaking changes)
   * project.github.actions.set(
   *   "actions/checkout@v2",
   *   "actions/checkout@aabbccdd1122334455667788990011223344556677",
   *   "v2.7.0"
   * );
   *
   * // Use a fork for a specific action
   * project.github.actions.set(
   *   "actions/setup-node",
   *   "my-org/setup-node-fork@1234567890abcdef1234567890abcdef12345678"
   * );
   *
   * // Multiple overrides - specific version takes precedence
   * project.github.actions.set(
   *   "actions/foo",
   *   "actions/foo@ffffffffffffffffffffffffffffffffffffffff" // default for all versions
   * );
   * project.github.actions.set(
   *   "actions/foo@v2",
   *   "actions/foo@aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" // specific override for v2
   * );
   * // Result: foo@v2 uses aaaa..., foo@v3 uses ffff..., foo@v4 uses ffff..., etc.
   */
  public set(action: string, override: string, tag?: string): void {
    this.parseActionCoordinate(override);
    this.overrides.set(action, { coordinate: override, tag });
  }

  /**
   * Resolve an action name to the full coordinate that should be used.
   * Also auto-adds actions from uses: fields for backward compatibility.
   *
   * @throws Error if no valid action is found.
   */
  public get(action: string): string {
    const { name, commit } = this.parseActionCoordinate(action, false);

    const found = this.getAction(name, commit);
    if (found) {
      return found;
    }

    // Auto-add if it's a valid action@commit coordinate
    if (commit && isValidCommit(commit)) {
      this.addAction(name, commit);
      return action;
    }

    // Error if legPassthrough for unknown/legacy formats (e.g., action@v5)
    throw new Error(
      `No valid action found with format: "namespace/action@commit". You can get the commit SHA from https://github.com/${action}/tags`
    );
  }

  /**
   * Resolve an action name to the full coordinate that should be used.
   *
   * Resolution order:
   * 1. Exact name and version override
   * 2. Only name override
   * 3. Added dependency
   * 5. Undefined
   */
  private getAction(name: string, commit: string): string | undefined {
    // Check for explicit overrides first
    const exactOverride = this.overrides.get(`${name}@${commit}`);
    if (exactOverride) {
      return exactOverride.coordinate;
    }

    const nameOverride = this.overrides.get(name);
    if (nameOverride) {
      return nameOverride.coordinate;
    }

    // Check if already added as a dependency
    const dep = this.project.deps.tryGetDependency(
      name,
      DependencyType.GITHUB_ACTION
    );
    if (dep?.version) {
      return `${name}@${dep.version}`;
    }

    return undefined;
  }

  /**
   * Get the tag for an action (for YAML inline comments).
   *
   * Returns the human-readable tag for the action, which will be
   * rendered as a comment after the SHA in workflow files.
   *
   * @param action The action coordinate (e.g., "actions/checkout" or "actions/checkout@sha")
   * @returns The tag string (e.g., "v5") or undefined if not applicable
   */
  public getTag(action: string): string | undefined {
    const name = action.split("@")[0];

    // Check if there's an override with a tag
    const override = this.overrides.get(action) ?? this.overrides.get(name);
    if (override) {
      return override.tag;
    }

    // Get tag from action dependency
    const dep = this.project.deps.tryGetDependency(
      name,
      DependencyType.GITHUB_ACTION
    );
    return dep?.metadata?.tag;
  }
}
