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

import { debug } from './debug';

/**
 * A container of contextual information
 *
 * @param shouldUseTypeScriptParserForJS a flag for parsing JavaScript code with TypeScript ESLint parser
 * @param sonarlint a flag for indicating whether the bridge is used in SonarLint context
 * @param bundles a set of rule bundles to load
 * @param workDir the working directory of the analyzed project (used for sonar-security
 */
export interface Context {
  shouldUseTypeScriptParserForJS: boolean;
  sonarlint: boolean;
  bundles: string[];
  workDir?: string;
}

/**
 * The global context
 *
 * It is available anywhere within the bridge as well as in
 * external and custom rules provided their definition sets
 * the `sonar-context` internal parameter.
 */
let context: Context;

/**
 * Returns the global context
 * @returns the global context
 */
export function getContext(): Context {
  return context;
}

/**
 * Sets the global context
 * @param ctx the new global context
 */
export function setContext(ctx: Context) {
  debug(`Context set with ${JSON.stringify(ctx)}`);
  context = { ...ctx };
}
