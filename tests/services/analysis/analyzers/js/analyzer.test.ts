/*
 * SonarQube JavaScript Plugin
 * Copyright (C) 2011-2023 SonarSource SA
 * mailto:info AT sonarsource DOT com
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */
import path from 'path';
import { setContext, toUnixPath } from 'helpers';
import { initializeLinter, RuleConfig } from 'linting/eslint';
import { analyzeJSTS } from 'services/analysis';
import { APIError } from 'errors';
import { jsTsInput } from '../../../../tools';
import { createProgram } from 'services/program';

describe('analyzeJSTS', () => {
  beforeEach(() => {
    setContext({
      shouldUseTypeScriptParserForJS: true,
      sonarlint: false,
      bundles: [],
    });
  });

  it('should fail on uninitialized linter', async () => {
    expect(() => analyzeJSTS({} as any)).toThrow(
      APIError.linterError('Linter default does not exist. Did you call /init-linter?'),
    );
  });

  it('should analyze JavaScript code with the given linter', async () => {
    const rules = [
      { key: 'prefer-default-last', configurations: [], fileTypeTarget: ['MAIN'] },
    ] as RuleConfig[];
    initializeLinter(rules);
    initializeLinter([], [], [], 'empty');

    const filePath = path.join(__dirname, 'fixtures', 'code.js');

    const {
      issues: [issue],
    } = analyzeJSTS(await jsTsInput({ filePath, createProgram: false }));

    const { issues } = analyzeJSTS(
      await jsTsInput({ filePath, linterId: 'empty', createProgram: false }),
    );

    expect(issue).toEqual(
      expect.objectContaining({
        ruleId: 'prefer-default-last',
      }),
    );

    expect(issues).toHaveLength(0);
  });

  it('should analyze TypeScript code with the given linter', async () => {
    const language = 'ts';
    const rules = [
      { key: 'bool-param-default', configurations: [], fileTypeTarget: ['MAIN'], language },
    ] as RuleConfig[];
    initializeLinter(rules);
    initializeLinter([], [], [], 'empty');

    const filePath = path.join(__dirname, 'fixtures', 'code.ts');

    const input = await jsTsInput({ filePath, language });
    const { issues: issues1 } = analyzeJSTS(input);

    input.linterId = 'empty';
    const { issues: issues2 } = analyzeJSTS(input);

    expect(issues2).toHaveLength(0);
    expect(issues1).toHaveLength(1);
    expect(issues1[0]).toEqual(
      expect.objectContaining({
        ruleId: 'bool-param-default',
      }),
    );
  });

  it('should analyze Vue.js code', async () => {
    const rules = [
      { key: 'no-dupe-keys', configurations: [], fileTypeTarget: ['MAIN'] },
    ] as RuleConfig[];
    initializeLinter(rules);

    const filePath = path.join(__dirname, 'fixtures', 'code.vue');

    const {
      issues: [issue],
    } = analyzeJSTS(await jsTsInput({ filePath, createProgram: false }));
    expect(issue).toEqual(
      expect.objectContaining({
        ruleId: 'no-dupe-keys',
      }),
    );
  });

  it('should analyze Vue.js code with type checks', async () => {
    const language = 'ts';
    const rules = [
      { key: 'strings-comparison', configurations: [], fileTypeTarget: ['MAIN'], language },
    ] as RuleConfig[];
    initializeLinter(rules);

    const filePath = path.join(__dirname, 'fixtures', 'vue_ts', 'file.vue');
    const tsConfigs = [path.join(__dirname, 'fixtures', 'vue_ts', 'tsconfig.json')];

    const {
      issues: [issue1],
    } = analyzeJSTS(await jsTsInput({ filePath, tsConfigs, language, createProgram: false }));
    expect(issue1).toEqual(
      expect.objectContaining({
        ruleId: 'strings-comparison',
      }),
    );
  });

  it('should analyze main files', async () => {
    const rules = [
      { key: 'prefer-promise-shorthand', configurations: [], fileTypeTarget: ['MAIN'] },
      { key: 'no-same-argument-assert', configurations: [], fileTypeTarget: ['TEST'] },
    ] as RuleConfig[];
    initializeLinter(rules);

    const filePath = path.join(__dirname, 'fixtures', 'main.js');

    const { issues } = analyzeJSTS(await jsTsInput({ filePath, createProgram: false }));
    expect(issues).toHaveLength(1);
    expect(issues[0]).toEqual(
      expect.objectContaining({
        ruleId: 'prefer-promise-shorthand',
      }),
    );
  });

  it('should analyze test files', async () => {
    const rules = [
      { key: 'no-with', configurations: [], fileTypeTarget: ['MAIN'] },
      { key: 'no-same-argument-assert', configurations: [], fileTypeTarget: ['TEST'] },
    ] as RuleConfig[];
    initializeLinter(rules);

    const filePath = path.join(__dirname, 'fixtures', 'test.js');
    const fileType = 'TEST';

    const { issues } = analyzeJSTS(await jsTsInput({ filePath, fileType, createProgram: false }));
    expect(issues).toHaveLength(1);
    expect(issues[0]).toEqual(
      expect.objectContaining({
        ruleId: 'no-same-argument-assert',
      }),
    );
  });

  it('should analyze main and test files', async () => {
    const rules = [
      { key: 'no-throw-literal', configurations: [], fileTypeTarget: ['MAIN', 'TEST'] },
      { key: 'no-exclusive-tests', configurations: [], fileTypeTarget: ['TEST'] },
    ] as RuleConfig[];
    initializeLinter(rules);

    const filePath = path.join(__dirname, 'fixtures', 'mixed.js');
    const fileType = 'TEST';

    const { issues } = analyzeJSTS(await jsTsInput({ filePath, fileType, createProgram: false }));
    expect(issues).toHaveLength(2);
    expect(issues.map(issue => issue.ruleId)).toEqual(
      expect.arrayContaining(['no-exclusive-tests', 'no-throw-literal']),
    );
  });

  it('should analyze shebang files', async () => {
    const rules = [
      { key: 'object-shorthand', configurations: [], fileTypeTarget: ['MAIN'] },
    ] as RuleConfig[];
    initializeLinter(rules);

    const filePath = path.join(__dirname, 'fixtures', 'shebang.js');

    const {
      issues: [issue],
    } = analyzeJSTS(await jsTsInput({ filePath, createProgram: false }));
    expect(issue).toEqual(
      expect.objectContaining({
        ruleId: 'object-shorthand',
      }),
    );
  });

  it('should analyze BOM files', async () => {
    const rules = [
      { key: 'no-extra-semi', configurations: [], fileTypeTarget: ['MAIN'] },
    ] as RuleConfig[];
    initializeLinter(rules);

    const filePath = path.join(__dirname, 'fixtures', 'bom.js');

    const {
      issues: [issue],
    } = analyzeJSTS(await jsTsInput({ filePath, createProgram: false }));
    expect(issue).toEqual(
      expect.objectContaining({
        ruleId: 'no-extra-semi',
      }),
    );
  });

  it('should analyze file contents', async () => {
    const rules = [
      { key: 'prefer-template', configurations: [], fileTypeTarget: ['MAIN'] },
    ] as RuleConfig[];
    initializeLinter(rules);

    const filePath = '/tmp/dir';
    const fileContent = `'foo' + bar + 'baz'`;

    const {
      issues: [issue],
    } = analyzeJSTS(await jsTsInput({ filePath, fileContent, createProgram: false }));
    expect(issue).toEqual(
      expect.objectContaining({
        ruleId: 'prefer-template',
      }),
    );
  });

  it('should analyze using TSConfig', async () => {
    const language = 'ts';
    const rules = [
      { key: 'no-useless-intersection', configurations: [], fileTypeTarget: ['MAIN'], language },
    ] as RuleConfig[];
    initializeLinter(rules);

    const filePath = path.join(__dirname, 'fixtures', 'tsconfig.ts');
    const tsConfigs = [path.join(__dirname, 'fixtures', 'tsconfig.json')];

    const {
      issues: [issue],
    } = analyzeJSTS(await jsTsInput({ filePath, tsConfigs, language }));
    expect(issue).toEqual(
      expect.objectContaining({
        ruleId: 'no-useless-intersection',
      }),
    );
  });

  it('should analyze using TypeScript program', async () => {
    const language = 'ts';
    const rules = [
      { key: 'no-array-delete', configurations: [], fileTypeTarget: ['MAIN'], language },
    ] as RuleConfig[];
    initializeLinter(rules);

    const filePath = path.join(__dirname, 'fixtures', 'program.ts');
    const tsConfigs = [path.join(__dirname, 'fixtures', 'tsconfig.json')];

    const {
      issues: [issue],
    } = analyzeJSTS(await jsTsInput({ filePath, tsConfigs, language }));
    expect(issue).toEqual(
      expect.objectContaining({
        ruleId: 'no-array-delete',
      }),
    );
  });

  it('should succeed with types using tsconfig with path aliases', async () => {
    const language = 'ts';
    const rules = [
      { key: 'strings-comparison', configurations: [], fileTypeTarget: ['MAIN'], language },
    ] as RuleConfig[];
    initializeLinter(rules);

    const filePath = path.join(__dirname, 'fixtures', 'paths', 'file.ts');

    const tsConfig = path.join(__dirname, 'fixtures', 'paths', 'tsconfig.json');

    const {
      issues: [issue],
    } = analyzeJSTS(await jsTsInput({ filePath, tsConfigs: [tsConfig], language }));
    expect(issue).toEqual(
      expect.objectContaining({
        ruleId: 'strings-comparison',
      }),
    );
  });

  it('should fail with types using tsconfig without paths aliases', async () => {
    const language = 'ts';
    const rules = [
      { key: 'strings-comparison', configurations: [], fileTypeTarget: ['MAIN'], language },
    ] as RuleConfig[];
    initializeLinter(rules);

    const filePath = path.join(__dirname, 'fixtures', 'paths', 'file.ts');

    const tsConfig = path.join(__dirname, 'fixtures', 'paths', 'tsconfig_no_paths.json');

    const {
      issues: [issue],
    } = analyzeJSTS(await jsTsInput({ filePath, tsConfigs: [tsConfig], language }));
    expect(issue).toEqual(
      expect.not.objectContaining({
        ruleId: 'strings-comparison',
      }),
    );
  });

  it('different tsconfig module resolution affects files included in program', async () => {
    const language = 'ts';
    const rules = [
      { key: 'strings-comparison', configurations: [], fileTypeTarget: ['MAIN'], language },
    ] as RuleConfig[];
    initializeLinter(rules);

    const filePath = path.join(__dirname, 'fixtures', 'module', 'file.ts');

    const nodeDependencyPath = path.join(
      __dirname,
      'fixtures',
      'module',
      'node_modules',
      'string42',
      'index.ts',
    );
    const nodenextDependencyPath = path.join(
      __dirname,
      'fixtures',
      'module',
      'node_modules',
      'string42',
      'export.ts',
    );
    const classicDependencyPath = path.join(__dirname, 'fixtures', 'module', 'string42.ts');

    const nodeTsConfig = path.join(__dirname, 'fixtures', 'module', 'tsconfig_commonjs.json');
    const nodeProgram = createProgram(nodeTsConfig);
    expect(nodeProgram.files).toContain(toUnixPath(nodeDependencyPath));
    expect(nodeProgram.files).not.toContain(toUnixPath(nodenextDependencyPath));
    expect(nodeProgram.files).not.toContain(toUnixPath(classicDependencyPath));
    const {
      issues: [nodeIssue],
    } = analyzeJSTS(await jsTsInput({ filePath, tsConfigs: [nodeTsConfig], language }));
    expect(nodeIssue).toEqual(
      expect.objectContaining({
        ruleId: 'strings-comparison',
      }),
    );

    const nodenextTsConfig = path.join(__dirname, 'fixtures', 'module', 'tsconfig_nodenext.json');
    const nodenextProgram = createProgram(nodenextTsConfig);
    expect(nodenextProgram.files).not.toContain(toUnixPath(nodeDependencyPath));
    expect(nodenextProgram.files).toContain(toUnixPath(nodenextDependencyPath));
    expect(nodenextProgram.files).not.toContain(toUnixPath(classicDependencyPath));
    const {
      issues: [nodenextIssue],
    } = analyzeJSTS(await jsTsInput({ filePath, tsConfigs: [nodenextTsConfig], language }));
    expect(nodenextIssue).toEqual(
      expect.objectContaining({
        ruleId: 'strings-comparison',
      }),
    );

    const classicTsConfig = path.join(__dirname, 'fixtures', 'module', 'tsconfig_esnext.json');
    const classicProgram = createProgram(classicTsConfig);
    expect(classicProgram.files).not.toContain(toUnixPath(nodeDependencyPath));
    expect(classicProgram.files).not.toContain(toUnixPath(nodenextDependencyPath));
    expect(classicProgram.files).toContain(toUnixPath(classicDependencyPath));
    const {
      issues: [classicIssue],
    } = analyzeJSTS(await jsTsInput({ filePath, tsConfigs: [classicTsConfig], language }));
    expect(classicIssue).toEqual(
      expect.objectContaining({
        ruleId: 'strings-comparison',
      }),
    );
  });

  it('should analyze using type information', async () => {
    const rules = [
      { key: 'different-types-comparison', configurations: [], fileTypeTarget: ['MAIN'] },
    ] as RuleConfig[];
    initializeLinter(rules);

    const filePath = path.join(__dirname, 'fixtures', 'type.js');
    const tsConfigs = [path.join(__dirname, 'fixtures', 'tsconfig.json')];

    const {
      issues: [issue],
    } = analyzeJSTS(await jsTsInput({ filePath, tsConfigs }));
    expect(issue).toEqual(
      expect.objectContaining({
        ruleId: 'different-types-comparison',
      }),
    );
  });

  it('should report issues', async () => {
    const rules = [
      { key: 'no-octal', configurations: [], fileTypeTarget: ['MAIN'] },
    ] as RuleConfig[];
    initializeLinter(rules);

    const filePath = path.join(__dirname, 'fixtures', 'issue.js');

    const { issues } = analyzeJSTS(await jsTsInput({ filePath, createProgram: false }));
    expect(issues).toEqual([
      {
        ruleId: 'no-octal',
        line: 1,
        column: 8,
        endLine: 1,
        endColumn: 11,
        message: 'Octal literals should not be used.',
        quickFixes: [],
        secondaryLocations: [],
      },
    ]);
  });

  it('should report secondary locations', async () => {
    const rules = [
      { key: 'destructuring-assignment-syntax', configurations: [], fileTypeTarget: ['MAIN'] },
    ] as RuleConfig[];
    initializeLinter(rules);

    const filePath = path.join(__dirname, 'fixtures', 'secondary.js');

    const {
      issues: [{ secondaryLocations }],
    } = analyzeJSTS(await jsTsInput({ filePath, createProgram: false }));
    expect(secondaryLocations).toEqual([
      {
        line: 3,
        column: 6,
        endLine: 3,
        endColumn: 19,
        message: 'Replace this assignment.',
      },
    ]);
  });

  it('should report quick fixes', async () => {
    const rules = [
      { key: 'no-unused-function-argument', configurations: [], fileTypeTarget: ['MAIN'] },
    ] as RuleConfig[];
    initializeLinter(rules);

    const filePath = path.join(__dirname, 'fixtures', 'quickfix.js');

    const {
      issues: [{ quickFixes }],
    } = analyzeJSTS(await jsTsInput({ filePath, createProgram: false }));
    expect(quickFixes).toEqual([
      {
        message: 'Rename "b" to "_b"',
        edits: [
          {
            text: '_',
            loc: {
              line: 1,
              column: 14,
              endLine: 1,
              endColumn: 14,
            },
          },
        ],
      },
      {
        message: 'Remove "b" (beware of call sites)',
        edits: [
          {
            text: '',
            loc: {
              line: 1,
              column: 14,
              endLine: 1,
              endColumn: 17,
            },
          },
        ],
      },
    ]);
  });

  it('should compute metrics on main files', async () => {
    const rules = [] as RuleConfig[];
    initializeLinter(rules);

    const filePath = path.join(__dirname, 'fixtures', 'metrics.js');

    const { highlights, highlightedSymbols, metrics, cpdTokens } = analyzeJSTS(
      await jsTsInput({ filePath, createProgram: false }),
    );

    const extendedMetrics = { highlights, highlightedSymbols, metrics, cpdTokens };
    expect(extendedMetrics).toEqual({
      highlights: [
        { textType: 'KEYWORD', location: { startLine: 1, startCol: 0, endLine: 1, endCol: 5 } },
        { textType: 'KEYWORD', location: { startLine: 4, startCol: 4, endCol: 10, endLine: 4 } },
        { textType: 'COMMENT', location: { startLine: 2, startCol: 2, endCol: 25, endLine: 2 } },
        { textType: 'COMMENT', location: { startLine: 4, startCol: 25, endCol: 35, endLine: 4 } },
      ],
      highlightedSymbols: [
        { declaration: { startLine: 1, startCol: 6, endLine: 1, endCol: 7 }, references: [] },
        { declaration: { startLine: 1, startCol: 6, endLine: 1, endCol: 7 }, references: [] },
        {
          declaration: { startLine: 3, startCol: 4, endLine: 3, endCol: 5 },
          references: [
            { startLine: 4, startCol: 13, endLine: 4, endCol: 14 },
            { startLine: 4, startCol: 21, endLine: 4, endCol: 22 },
          ],
        },
        {
          declaration: { startLine: 3, startCol: 7, endLine: 3, endCol: 8 },
          references: [{ startLine: 5, startCol: 2, endLine: 5, endCol: 3 }],
        },
        {
          declaration: { startLine: 1, startCol: 8, endLine: 1, endCol: 9 },
          references: [{ startLine: 6, startCol: 0, endLine: 6, endCol: 1 }],
        },
      ],
      metrics: {
        classes: 1,
        cognitiveComplexity: 1,
        commentLines: [2],
        complexity: 2,
        executableLines: [4],
        functions: 1,
        ncloc: [1, 3, 4, 5, 6],
        nosonarLines: [4],
        statements: 1,
      },
      cpdTokens: [
        {
          image: 'class',
          location: {
            endCol: 5,
            endLine: 1,
            startCol: 0,
            startLine: 1,
          },
        },
        {
          image: 'C',
          location: {
            endCol: 7,
            endLine: 1,
            startCol: 6,
            startLine: 1,
          },
        },
        {
          image: '{',
          location: {
            endCol: 9,
            endLine: 1,
            startCol: 8,
            startLine: 1,
          },
        },
        {
          image: 'm',
          location: {
            endCol: 3,
            endLine: 3,
            startCol: 2,
            startLine: 3,
          },
        },
        {
          image: '(',
          location: {
            endCol: 4,
            endLine: 3,
            startCol: 3,
            startLine: 3,
          },
        },
        {
          image: 'p',
          location: {
            endCol: 5,
            endLine: 3,
            startCol: 4,
            startLine: 3,
          },
        },
        {
          image: ')',
          location: {
            endCol: 6,
            endLine: 3,
            startCol: 5,
            startLine: 3,
          },
        },
        {
          image: '{',
          location: {
            endCol: 8,
            endLine: 3,
            startCol: 7,
            startLine: 3,
          },
        },
        {
          image: 'return',
          location: {
            endCol: 10,
            endLine: 4,
            startCol: 4,
            startLine: 4,
          },
        },
        {
          image: 'f',
          location: {
            endCol: 12,
            endLine: 4,
            startCol: 11,
            startLine: 4,
          },
        },
        {
          image: '(',
          location: {
            endCol: 13,
            endLine: 4,
            startCol: 12,
            startLine: 4,
          },
        },
        {
          image: 'p',
          location: {
            endCol: 14,
            endLine: 4,
            startCol: 13,
            startLine: 4,
          },
        },
        {
          image: ')',
          location: {
            endCol: 15,
            endLine: 4,
            startCol: 14,
            startLine: 4,
          },
        },
        {
          image: '&&',
          location: {
            endCol: 18,
            endLine: 4,
            startCol: 16,
            startLine: 4,
          },
        },
        {
          image: 'g',
          location: {
            endCol: 20,
            endLine: 4,
            startCol: 19,
            startLine: 4,
          },
        },
        {
          image: '(',
          location: {
            endCol: 21,
            endLine: 4,
            startCol: 20,
            startLine: 4,
          },
        },
        {
          image: 'p',
          location: {
            endCol: 22,
            endLine: 4,
            startCol: 21,
            startLine: 4,
          },
        },
        {
          image: ')',
          location: {
            endCol: 23,
            endLine: 4,
            startCol: 22,
            startLine: 4,
          },
        },
        {
          image: ';',
          location: {
            endCol: 24,
            endLine: 4,
            startCol: 23,
            startLine: 4,
          },
        },
        {
          image: '}',
          location: {
            endCol: 3,
            endLine: 5,
            startCol: 2,
            startLine: 5,
          },
        },
        {
          image: '}',
          location: {
            endCol: 1,
            endLine: 6,
            startCol: 0,
            startLine: 6,
          },
        },
      ],
    });
  });

  it('should compute metrics on test files', async () => {
    const rules = [] as RuleConfig[];
    initializeLinter(rules);

    const filePath = path.join(__dirname, 'fixtures', 'metrics.js');
    const fileType = 'TEST';

    const { highlights, highlightedSymbols, metrics, cpdTokens } = analyzeJSTS(
      await jsTsInput({ filePath, fileType, createProgram: false }),
    );

    const extendedMetrics = { highlights, highlightedSymbols, metrics, cpdTokens };
    expect(extendedMetrics).toEqual({
      cpdTokens: undefined,
      highlights: [
        { textType: 'KEYWORD', location: { startLine: 1, startCol: 0, endLine: 1, endCol: 5 } },
        { textType: 'KEYWORD', location: { startLine: 4, startCol: 4, endCol: 10, endLine: 4 } },
        { textType: 'COMMENT', location: { startLine: 2, startCol: 2, endCol: 25, endLine: 2 } },
        { textType: 'COMMENT', location: { startLine: 4, startCol: 25, endCol: 35, endLine: 4 } },
      ],
      highlightedSymbols: [
        { declaration: { startLine: 1, startCol: 6, endLine: 1, endCol: 7 }, references: [] },
        { declaration: { startLine: 1, startCol: 6, endLine: 1, endCol: 7 }, references: [] },
        {
          declaration: { startLine: 3, startCol: 4, endLine: 3, endCol: 5 },
          references: [
            { startLine: 4, startCol: 13, endLine: 4, endCol: 14 },
            { startLine: 4, startCol: 21, endLine: 4, endCol: 22 },
          ],
        },
        {
          declaration: { startLine: 3, startCol: 7, endLine: 3, endCol: 8 },
          references: [{ startLine: 5, startCol: 2, endLine: 5, endCol: 3 }],
        },
        {
          declaration: { startLine: 1, startCol: 8, endLine: 1, endCol: 9 },
          references: [{ startLine: 6, startCol: 0, endLine: 6, endCol: 1 }],
        },
      ],
      metrics: {
        nosonarLines: [4],
      },
    });
  });

  it('should compute metrics in SonarLint context', async () => {
    setContext({
      shouldUseTypeScriptParserForJS: false,
      sonarlint: true,
      bundles: [],
    });

    const rules = [] as RuleConfig[];
    initializeLinter(rules);

    const filePath = path.join(__dirname, 'fixtures', 'metrics.js');

    const { highlights, highlightedSymbols, metrics, cpdTokens } = analyzeJSTS(
      await jsTsInput({ filePath, createProgram: false }),
    );

    const extendedMetrics = { highlights, highlightedSymbols, metrics, cpdTokens };
    expect(extendedMetrics).toEqual({
      metrics: {
        nosonarLines: [4],
      },
    });
  });

  it('should measure analysis duration', async () => {
    const rules = [
      { key: 'no-extra-smi', configurations: [], fileTypeTarget: ['MAIN'] },
      { key: 'no-duplicate-string', configurations: [], fileTypeTarget: ['MAIN'] },
      { key: 'sonar-no-regex-spaces', configurations: [], fileTypeTarget: ['MAIN'] },
    ] as RuleConfig[];
    initializeLinter(rules);

    const filePath = path.join(__dirname, 'fixtures', 'measure.js');

    const {
      perf: { parseTime, analysisTime },
    } = analyzeJSTS(await jsTsInput({ filePath, createProgram: false }));
    expect(parseTime).toBeGreaterThan(0);
    expect(analysisTime).toBeGreaterThan(0);
  });

  it('should return parsing errors', async () => {
    const rules = [];
    initializeLinter(rules);

    const filePath = path.join(__dirname, 'fixtures', 'parsing-error.js');
    const analysisInput = await jsTsInput({ filePath, createProgram: false });
    expect(() => analyzeJSTS(analysisInput)).toThrow(
      APIError.parsingError('Unexpected token (3:0)', { line: 3 }),
    );
  });

  it('should find issues requiring typing in JavaScript', async () => {
    const rules = [
      { key: 'strings-comparison', configurations: [], fileTypeTarget: ['MAIN'] },
    ] as RuleConfig[];
    initializeLinter(rules);

    const filePath = path.join(__dirname, 'fixtures', 'js_types', 'main.js');

    const {
      issues: [issuesWithProject],
    } = analyzeJSTS(await jsTsInput({ filePath }));
    expect(issuesWithProject).toEqual(
      expect.objectContaining({
        ruleId: 'strings-comparison',
        line: 4,
      }),
    );
  });
});
