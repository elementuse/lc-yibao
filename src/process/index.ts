import { Rule, SchematicContext, Tree, apply, url, template, move, chain, branchAndMerge, mergeWith, filter } from '@angular-devkit/schematics';
import { getWorkspace } from '@schematics/angular/utility/config';
import { getProjectFromWorkspace } from '@angular/cdk/schematics';
import { Schema } from './schema';
import { dasherize, classify } from '@angular-devkit/core/src/utils/strings';
import { parseName } from '../utils/parse-name';
import { findModuleFromOptions } from '../schematics-angular-utils/find-module';

export default function(_options: Schema): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    setupOptions(_options, tree);
    console.log('options', _options);
    
    const templateSource = apply(url('./files'), [
      filterTemplates(_options),
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
      ]))
    ]);
  };
}

function setupOptions(_options: Schema, tree: Tree) {
  const workspace = getWorkspace(tree);
  const project = getProjectFromWorkspace(workspace, _options.project);

  _options.type = "process";
  if(_options.path === undefined) {
    _options.path = `${project.sourceRoot}/${_options.type}`
  }

  const parsedPath = parseName(_options.path, _options.name);
  _options.name = parsedPath.name;
  _options.path = parsedPath.path;

  _options.module = _options.module || findModuleFromOptions(tree, _options) || '';
}

function filterTemplates(options: Schema): Rule {
  if (!options.advice) {
    return filter(path => !path.match(/advice-/) && !path.match(/\.bak$/));
  }
  return filter(path => !path.match(/\.bak$/));
}