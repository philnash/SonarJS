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
import fs from 'fs';
import path from 'path';
import tmp from 'tmp';

/**
 * Byte Order Marker
 */
const BOM_BYTE = 0xfeff;

/**
 * The type of input file
 *
 * The scanner indexes input files based on the project configuration,
 * if any. It determines wheter an input file denotes a `MAIN` file,
 * i.e., a source file, or a `TEST` file.
 *
 * The type of input file is then used by the linter to select which
 * rule configurations to apply, that is, which rules the linter should
 * use to analyze the file.
 */
export type FileType = 'MAIN' | 'TEST';

/**
 * Asynchronous read of file contents from a file path
 *
 * The function gets rid of any Byte Order Marker (BOM)
 * present in the file's header.
 *
 * @param filePath the path of a file
 * @returns Promise which resolves with the content of the file
 */
export async function readFile(filePath: string) {
  const fileContent = await fs.promises.readFile(filePath, { encoding: 'utf8' });
  return stripBOM(fileContent);
}

/**
 * Synchronous read of file contents from a file path
 *
 * The function gets rid of any Byte Order Marker (BOM)
 * present in the file's header.
 *
 * @param filePath the path of a file
 * @returns Promise which resolves with the content of the file
 */
export function readFileSync(filePath: string) {
  const fileContent = fs.readFileSync(filePath, { encoding: 'utf8' });
  return stripBOM(fileContent);
}

/**
 * Removes any Byte Order Marker (BOM) from a string's head
 *
 * A string's head is nothing else but its first character.
 *
 * @param str the input string
 * @returns the stripped string
 */
export function stripBOM(str: string) {
  if (str.charCodeAt(0) === BOM_BYTE) {
    return str.slice(1);
  }
  return str;
}
/**
 * Converts a path to Unix format
 * @param path the path to convert
 * @returns the converted path
 */
export function toUnixPath(path: string) {
  return path.replace(/[\\/]+/g, '/').replace(/(\.\/)/, '');
}

/**
 * Adds tsconfig.json to a path if it does not exist
 *
 * @param tsConfig
 */
export function addTsConfigIfDirectory(tsConfig: string) {
  try {
    if (fs.lstatSync(tsConfig).isDirectory()) {
      return path.join(tsConfig, 'tsconfig.json');
    }

    return tsConfig;
  } catch {
    return null;
  }
}

/**
 * Any temporary file created with the `tmp` library will be removed once the Node.js process terminates.
 */
tmp.setGracefulCleanup();

/**
 * Create the tmp file and returns its path.
 *
 * The file is written in a temporary location in the file system
 * and is marked to be removed after Node.js process terminates.
 *
 * @param contents contents to write
 * @returns the resolved file path
 */
export function writeTmpFile(contents: string): string {
  const { name: filename } = tmp.fileSync();
  fs.writeFileSync(filename, contents, 'utf-8');
  return toUnixPath(filename);
}
