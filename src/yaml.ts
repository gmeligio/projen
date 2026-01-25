import { IConstruct } from "constructs";
import * as YAML from "yaml";
import { IResolver } from "./file";
import { ObjectFile, ObjectFileOptions } from "./object-file";

/**
 * Options for `JsonFile`.
 */
export interface YamlFileOptions extends ObjectFileOptions {
  /**
   * Maximum line width (set to 0 to disable folding).
   *
   * @default - 0
   */
  readonly lineWidth?: number;
}

/**
 * Represents a YAML file.
 */
export class YamlFile extends ObjectFile {
  /**
   * Maximum line width (set to 0 to disable folding).
   */
  public lineWidth: number;

  /**
   * Inline comments to add to specific paths in the YAML output.
   * Key is the dot-separated path, value is the comment text.
   */
  private readonly inlineComments = new Map<string, string>();

  constructor(scope: IConstruct, filePath: string, options: YamlFileOptions) {
    super(scope, filePath, options);
    this.lineWidth = options.lineWidth ?? 0;
  }

  /**
   * Add an inline comment to a value at the specified path.
   *
   * The comment will appear after the value on the same line.
   *
   * @param path Dot-separated path to the value (e.g., "jobs.build.steps.0.uses")
   * @param comment The comment text (without the # prefix)
   *
   * @example
   * yamlFile.addInlineComment("jobs.build.steps.0.uses", "v5");
   * // Results in: uses: actions/checkout@sha # v5
   */
  public addInlineComment(path: string, comment: string): void {
    this.inlineComments.set(path, comment);
  }

  protected synthesizeContent(resolver: IResolver): string | undefined {
    const json = super.synthesizeContent(resolver);
    if (!json) {
      return undefined;
    }

    // Parse JSON and create YAML document
    const obj = JSON.parse(json);
    const doc = new YAML.Document(obj);

    // Apply inline comments
    for (const [path, comment] of this.inlineComments) {
      const segments = this.parsePath(path);
      const node = doc.getIn(segments, true);
      if (node && YAML.isScalar(node)) {
        node.comment = ` ${comment}`;
      }
    }

    return [
      ...(this.marker ? [`# ${this.marker}`] : []),
      "",
      doc.toString({
        indent: 2,
        lineWidth: this.lineWidth,
      }),
    ].join("\n");
  }

  /**
   * Parse a dot-separated path into segments, handling numeric indices.
   */
  private parsePath(path: string): (string | number)[] {
    return path.split(".").map((segment) => {
      const num = parseInt(segment, 10);
      return isNaN(num) ? segment : num;
    });
  }
}
