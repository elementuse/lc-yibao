
import { Rule, Tree, SchematicsException } from '@angular-devkit/schematics';
import * as ts from 'typescript';

// Referencing forked and copied private APIs 
import { buildRelativePath } from '../schematics-angular-utils/find-module';
import { addDeclarationToModule, addExportToModule } from '../schematics-angular-utils/ast-utils';
import { InsertChange } from '../schematics-angular-utils/change';

export function addDeclarationToNgModule(modulePath: string, componentName: string, componentPath: string, exports: boolean = false): Rule {
  return (host: Tree) => {
    addDeclaration(host, modulePath, componentName, componentPath);
    if (exports) {
      addExport(host, modulePath, componentName, componentPath);
    }
    return host;
  };
}

function createSource(host: Tree, modulePath: string) {
  const text = host.read(modulePath);

  if (text === null) {
    throw new SchematicsException(`File ${modulePath} does not exist!`);
  }
  const sourceText = text.toString('utf-8');
  return ts.createSourceFile(modulePath, sourceText, ts.ScriptTarget.Latest, true);
}

function addDeclaration(host: Tree, modulePath: string, componentName: string, componentPath: string) {
  const declarationChanges = addDeclarationToModule(
    createSource(host, modulePath),
    modulePath,
    componentName,
    buildRelativePath(modulePath, componentPath));

  const declarationRecorder = host.beginUpdate(modulePath);
  for (const change of declarationChanges) {
    if (change instanceof InsertChange) {
      declarationRecorder.insertLeft(change.pos, change.toAdd);
    }
  }
  host.commitUpdate(declarationRecorder);
};

function addExport(host: Tree, modulePath: string, componentName: string, componentPath: string) {
  const exportChanges = addExportToModule(
    createSource(host, modulePath),
    modulePath,
    componentName,
    buildRelativePath(modulePath, componentPath));

  const exportRecorder = host.beginUpdate(modulePath);
  for (const change of exportChanges) {
    if (change instanceof InsertChange) {
      exportRecorder.insertLeft(change.pos, change.toAdd);
    }
  }
  host.commitUpdate(exportRecorder);
};