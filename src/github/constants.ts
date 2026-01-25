import { GitIdentity } from ".";
import { ActionSpec } from "./actions-provider";

/**
 * Name of the artifact produced by the build job. Its contains the entire
 * working directory.
 */
export const BUILD_ARTIFACT_NAME = "build-artifact";

/**
 * Represents the `github-actions[bot]` user.
 *
 * Use this when you need to perform a commit as part of your workflow.
 */
export const DEFAULT_GITHUB_ACTIONS_USER: GitIdentity = {
  // https://github.com/actions/checkout/blob/08c6903cd8c0fde910a37f88322edcfb5dd907a8/README.md#push-a-commit-using-the-built-in-token
  name: "github-actions[bot]",
  email: "41898282+github-actions[bot]@users.noreply.github.com",
};

/**
 * Name of the permission back up file to include in the build artifact
 * to work around a GitHub Action bug that does not preserve file mode
 * permissions across upload and download actions.
 *
 * See {@link https://github.com/actions/upload-artifact/issues/38}
 */
export const PERMISSION_BACKUP_FILE = "permissions-backup.acl";

/**
 * Default GitHub Actions used across projen workflows.
 * All actions are pinned to specific commit SHAs for security and reproducibility.
 */
export const DEFAULT_ACTIONS: Record<string, ActionSpec> = {
  // Official GitHub Actions - Workflow Utilities
  CHECKOUT: {
    coordinate: "actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683",
    tag: "v5",
  },
  UPLOAD_ARTIFACT: {
    coordinate:
      "actions/upload-artifact@65c4c4a1ddee5b72f698fdd19549f0f0fb45cf08",
    tag: "v4.6.2",
  },
  DOWNLOAD_ARTIFACT: {
    coordinate:
      "actions/download-artifact@d3f86a106a0bac45b974a628896c90dbdf5c8093",
    tag: "v4",
  },
  GITHUB_SCRIPT: {
    coordinate:
      "actions/github-script@60a0d83039c74a4aee543508d2ffcb1c3799cdea",
    tag: "v8",
  },
  STALE: {
    coordinate: "actions/stale@5bef64f19d7facfb25b37b414482c7164d639639",
    tag: "v10",
  },
  CREATE_GITHUB_APP_TOKEN: {
    coordinate:
      "actions/create-github-app-token@df432ccc7b4c9e1c21e31ffb7c1a8857da1cf38b",
    tag: "v5",
  },

  // Official GitHub Actions - Language/Runtime Setup
  SETUP_NODE: {
    coordinate: "actions/setup-node@cdca7365b2dadb8aad0a33bc7601856ffabcc48e",
    tag: "v5",
  },
  SETUP_JAVA: {
    coordinate: "actions/setup-java@c5195efecf7bdfc987ee8bae7a71cb8b11521c00",
    tag: "v5",
  },
  SETUP_PYTHON: {
    coordinate: "actions/setup-python@a26af69be951a213d495a4c3e4e4022e16d87065",
    tag: "v6",
  },
  SETUP_GO: {
    coordinate: "actions/setup-go@d35c59abb061a4a6fb18e82ac0862c26744d6ab5",
    tag: "v6",
  },
  SETUP_DOTNET: {
    coordinate: "actions/setup-dotnet@3e891b0cb619f3d2f76d4f3a607088796fe27110",
    tag: "v5",
  },

  // Third-Party Actions - Language/Runtime Setup
  SETUP_PNPM: {
    coordinate: "pnpm/action-setup@a7487c7e89a18df4991f7f222e4898a00d66ddda",
    tag: "v4",
  },
  SETUP_BUN: {
    coordinate: "oven-sh/setup-bun@735343b667d3e6f658f44e0eca948eb6282f2b76",
    tag: "v2",
  },

  // Third-Party Actions
  AUTO_APPROVE: {
    coordinate:
      "hmarr/auto-approve-action@f0939ea97e9205ef24d872e76833fa908a770363",
    tag: "v4",
  },
  ENABLE_PR_AUTOMERGE: {
    coordinate:
      "peter-evans/enable-pull-request-automerge@b9890d06ee695786c8a5162e17cffea87dc2783c",
    tag: "v3",
  },
  CREATE_PULL_REQUEST: {
    coordinate:
      "peter-evans/create-pull-request@271a8d0340265f705b14b6d32b9829c1cb33d45e",
    tag: "v7",
  },
  BACKPORT: {
    coordinate:
      "sqren/backport-github-action@f50817aa8ce70be9907861f88e18394c20c02bcc",
    tag: "v9.5.1",
  },
  SEMANTIC_PR: {
    coordinate:
      "amannn/action-semantic-pull-request@5d6e5e2ff54bec29e72e52cd1b79d543e7186669",
    tag: "v6",
  },
};
