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
package org.sonar.javascript.checks;

import java.util.List;
import org.sonar.check.Rule;
import org.sonar.plugins.javascript.api.EslintBasedCheck;
import org.sonar.plugins.javascript.api.TypeScriptRule;

@TypeScriptRule
@Rule(key = "S6550")
public class PreferLiteralEnumMemberCheck implements EslintBasedCheck {

  @Override
  public List<Object> configurations() {
    return List.of(new Config());
  }

  @Override
  public String eslintKey() {
    return "prefer-literal-enum-member";
  }

  private static class Config {

    // Option to allow bitwise expressions in enum initializers (Default: false).
    // We might consider changing this flag value if the rule is too noisy.
    // For example, in the ruling, the rule reports +500 issues for the TypeScript project.
    // Remark: Adding a rule property afterward might cause deployment issues with SonarCloud.
    boolean allowBitwiseExpressions = false;
  }
}
