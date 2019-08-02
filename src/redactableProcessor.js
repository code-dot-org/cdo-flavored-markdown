const unified = require("unified");

const TextParser = require("./plugins/parser/TextParser");
const TextCompiler = require("./plugins/compiler/TextCompiler");

const { redact, restore, plugins } = require("remark-redactable");

module.exports = class RedactableProcessor {
  constructor() {
    this.compilerPlugins = this.constructor.getCompilerPlugins();
    this.parserPlugins = this.constructor.getParserPlugins();
  }

  sourceToSyntaxTree(source) {
    return unified()
      .use(this.constructor.getParser())
      .use(this.parserPlugins)
      .parse(source);
  }

  sourceToRedactedSyntaxTree(source) {
    return unified()
      .use(this.constructor.getParser())
      .use(redact)
      .use(this.parserPlugins)
      .parse(source);
  }

  sourceToProcessed(source) {
    return unified()
      .use(this.constructor.getParser())
      .use(this.constructor.getCompiler())
      .use(this.parserPlugins)
      .use(this.compilerPlugins)
      .processSync(source).contents;
  }

  sourceToRedacted(source) {
    const sourceTree = this.sourceToRedactedSyntaxTree(source);
    return unified()
      .use(this.constructor.getParser())
      .use(this.constructor.getCompiler())
      .use(redact)
      .use(this.parserPlugins)
      .use(this.compilerPlugins)
      .stringify(sourceTree);
  }

  sourceAndRedactedToMergedSyntaxTree(source, redacted) {
    const sourceTree = this.sourceToRedactedSyntaxTree(source);
    return unified()
      .use(this.constructor.getParser())
      .use(restore(sourceTree))
      .use(this.parserPlugins)
      .parse(redacted);
  }

  sourceAndRedactedToRestored(source, redacted) {
    const mergedSyntaxTree = this.sourceAndRedactedToMergedSyntaxTree(
      source,
      redacted
    );
    return unified()
      .use(this.constructor.getParser())
      .use(this.constructor.getCompiler())
      .use(this.parserPlugins)
      .use(this.compilerPlugins)
      .stringify(mergedSyntaxTree);
  }

  static getParser() {
    return TextParser;
  }

  static getParserPlugins() {
    return [];
  }

  static getCompiler() {
    return TextCompiler;
  }

  static getCompilerPlugins() {
    return [plugins.rawtext];
  }

  static create() {
    return new RedactableProcessor();
  }
};
