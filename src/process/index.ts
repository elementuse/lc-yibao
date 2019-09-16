import { Rule, SchematicContext, Tree, apply, url, template, move, chain, branchAndMerge, mergeWith, filter, SchematicsException } from '@angular-devkit/schematics';
import { getWorkspace } from '@schematics/angular/utility/config';
import { getProjectFromWorkspace} from '@angular/cdk/schematics';
import { Schema } from './schema';
import { dasherize, classify } from '@angular-devkit/core/src/utils/strings';
import { parseName } from '../utils/parse-name';
import { findModuleFromOptions, buildRelativePath } from '../schematics-angular-utils/find-module';
import { addDeclarationToNgModule, addProviderToNgModule } from '../utils/ng-module-utils';
import { InsertChange, Change } from '../schematics-angular-utils/change';
import { getSourceNodes } from '../schematics-angular-utils/ast-utils';
import { insertImport } from '../schematics-angular-utils/route-utils';
import * as ts from 'typescript';

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
        addAdviceDeclarationToModule(_options),
        addChargeItemProviderToModule(_options),
        addChargeItemToFactor(_options),
        addClientProxyProviderToModule(_options),
        addProcessDeclarationToModule(_options),
        addRefundDeclarationToModule(_options)
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
  _options.sourcePath = '/' + project.sourceRoot;

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

function addAdviceDeclarationToModule(options: Schema): Rule {
  if (options.advice) {
    return addDeclarationToNgModule(
      options.module||'',
      `Advice${classify(options.name)}Component`,
      `${options.path}/${dasherize(options.name)}/advice-${dasherize(options.name)}.component`,
    );
  }
  else {
    return (host: Tree) => host;
  }
}

function addChargeItemProviderToModule(options: Schema): Rule {
  return addProviderToNgModule(
    `${options.sourcePath}/shared/chargeItem-service.module.ts`,
    `ChargeItem${classify(options.name)}Service`,
    `${options.path}/${dasherize(options.name)}/chargeItem-${dasherize(options.name)}.service`,
  );
}

function addChargeItemToFactor(options: Schema): Rule {
  return (host: Tree) => {
    let targetFilePath = `${options.sourcePath}/shared/ChargeItem.factory.ts`;
    let changes = buildChargeitemFactorChanges(host, options, targetFilePath);
      
    const recorder = host.beginUpdate(targetFilePath);
    for (let change of changes) {
        if (change instanceof InsertChange) {
            recorder.insertLeft(change.pos, change.toAdd);
        }
    }
    host.commitUpdate(recorder);

    return host;
  };
};

function buildChargeitemFactorChanges(host: Tree, options: Schema, targetFilePath: string): Change[] {
  let text = host.read(targetFilePath);
  if (!text) throw new SchematicsException(`File ${targetFilePath} does not exist.`);
  let sourceText = text.toString('utf-8');

  let sourceFile = ts.createSourceFile(targetFilePath, sourceText, ts.ScriptTarget.Latest, true);

  let nodes = getSourceNodes(sourceFile);

  let defaultNode = nodes.find(n => n.kind === ts.SyntaxKind.DefaultClause);
  if (!defaultNode) {
    throw new SchematicsException('default node not find!');
  }
  if (!defaultNode.parent) {
    throw new SchematicsException('default node not find!');
  }

  let listNode = defaultNode.parent.getChildren().find(n => n.kind == ts.SyntaxKind.SyntaxList);
  if (!listNode) {
    throw new SchematicsException('syntax error!');
  }

  let siblings = listNode.getChildren();
  let defaultIndex = siblings.indexOf(defaultNode);
  siblings.splice(defaultIndex, 1);

  let toAdd = `

            case '${classify(options.name)}':
                return this.injector.get(ChargeItem${classify(options.name)}Service);`
  let change: Change;
  if (siblings.length == 0) {
    change = new InsertChange(targetFilePath, listNode.pos, toAdd);
  }
  else {
    let lastNode = siblings[siblings.length - 1];
    change = new InsertChange(targetFilePath, lastNode.end, toAdd);
  }

  return [
      insertImport(
        sourceFile,
        targetFilePath,
        `ChargeItem${classify(options.name)}Service`,
        buildRelativePath(targetFilePath, `${options.path}/${dasherize(options.name)}/chargeItem-${dasherize(options.name)}.service`)
      ),
      change
  ];

}

function addClientProxyProviderToModule(options: Schema): Rule {
  return addProviderToNgModule(
    `${options.sourcePath}/shared/chargeItem-service.module.ts`,
    `Client${classify(options.name)}Proxy`,
    `${options.path}/${dasherize(options.name)}/client-${dasherize(options.name)}.proxy`,
  );
}

function addProcessDeclarationToModule(options: Schema): Rule {
  return addDeclarationToNgModule(
    options.module||'',
    `Process${classify(options.name)}Component`,
    `${options.path}/${dasherize(options.name)}/process-${dasherize(options.name)}.component`,
  );
}

function addRefundDeclarationToModule(options: Schema): Rule {
  return addDeclarationToNgModule(
    options.module||'',
    `Refund${classify(options.name)}Component`,
    `${options.path}/${dasherize(options.name)}/refund-${dasherize(options.name)}.component`,
  );
}
