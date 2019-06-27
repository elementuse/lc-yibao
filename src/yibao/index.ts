import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { Schema } from './schema';
import chalk from 'chalk';
import { getWorkspace } from '@schematics/angular/utility/config';
import { getProjectFromWorkspace, getProjectMainFile } from '@angular/cdk/schematics';
import { getAppModulePath } from '@schematics/angular/utility/ng-ast-utils';

export default function(_options: Schema): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    console.log('options', _options);
    const workspace = getWorkspace(tree);
    const project = getProjectFromWorkspace(workspace, _options.project);
    const appModulePath = getAppModulePath(tree, getProjectMainFile(project));
    console.log(chalk.yellow(`getProjectMainFile: "${chalk.blue(getProjectMainFile(project))}" `));
    console.log("appModulePath::" + JSON.stringify(appModulePath));
    return tree;
  };
}
