import { Rule, SchematicContext, Tree, apply, url, template, move, chain, branchAndMerge, mergeWith } from '@angular-devkit/schematics';
import { getWorkspace } from '@schematics/angular/utility/config';
import { getProjectFromWorkspace } from '@angular/cdk/schematics';
import { Schema } from './schema';
import { dasherize, classify } from '@angular-devkit/core/src/utils/strings';
import { parseName } from '../utils/parse-name';
import { addDeclarationToNgModule } from '../utils/ng-module-utils';
import { findModuleFromOptions, findRouteModuleFromOptions } from '../schematics-angular-utils/find-module';
import { addComponentIntoRouteMoudle } from '../utils/add-routemodule';

export default function(_options: Schema): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    setupOptions(_options, tree);

    console.log(_options);
    
    const templateSource = apply(url('./files'), [
      template({
        dasherize,
        classify,
        ..._options
      }),
      move(_options.path || '')
    ]);

    return chain([
      branchAndMerge(chain([
        mergeWith(templateSource),
        addDeclarationToNgModule(_options, false),
        addComponentIntoRouteMoudle(_options)
      ]))
    ]);
  };
}

function setupOptions(_options: Schema, tree: Tree) {
  const workspace = getWorkspace(tree);
  const project = getProjectFromWorkspace(workspace, _options.project);

  _options.type = "setting";
  if(_options.path === undefined) {
    _options.path = `${project.sourceRoot}/app/yibao/${_options.type}`
  }

  const parsedPath = parseName(_options.path, _options.name);
  _options.name = parsedPath.name;
  _options.path = parsedPath.path;

  _options.module = _options.module || findModuleFromOptions(tree, _options) || '';
}

function addNavModulesToModule(options: Schema) {
  return (host: Tree) => {
    addDeclarationToNgModule(options, false);
    return host;
  };
}
// function addToModule(_options: Schema) {
//   return (host: Tree) => {
//     addModuleImportToModule
//   };
// }
