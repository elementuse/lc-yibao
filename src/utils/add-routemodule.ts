import { Tree, SchematicsException, Rule } from "@angular-devkit/schematics";
import { ModuleOptions, buildRelativePath } from "../schematics-angular-utils/find-module";
import * as ts from 'typescript';
import { insertImport } from "../schematics-angular-utils/route-utils";
import { getSourceNodes } from "../schematics-angular-utils/ast-utils";
import { Change, InsertChange } from "../schematics-angular-utils/change";
import { findFileByName } from "./find-file";
import { strings } from '@angular-devkit/core';


const classify = strings.classify;
const dasherize = strings.dasherize;

export class AddRouteModuleContext {
    moduleFilePath: string;
    routePath: string;
    componentName: string;
    relativeComponentPath: string;
}

function createAddRouteModuleContext(options: ModuleOptions, host: Tree): AddRouteModuleContext {
    
    let routePath = classify(options.name);
    let moduleFilePath = findFileByName(`${dasherize(options.type || '')}-routing.module.ts`, options.path || '/', host);
    let componentName = `${classify(options.name)}${classify(options.type||'')}Component`;
    let componentPath = `${options.path}/${dasherize(options.name)}/${dasherize(options.name)}-${dasherize(options.type || '')}.component`;
    let relativeComponentPath = buildRelativePath(moduleFilePath, componentPath);

    return {
        moduleFilePath,
        routePath,
        componentName,
        relativeComponentPath
    }
}

export function addComponentIntoRouteMoudle(options: ModuleOptions): Rule {
    return (host: Tree) => {
        let context = createAddRouteModuleContext(options, host);

        let changes = buildRouteMoudleChanges(context, host, options);
        
        const recorder = host.beginUpdate(context.moduleFilePath);
        for (let change of changes) {
            if (change instanceof InsertChange) {
                recorder.insertLeft(change.pos, change.toAdd);
            }
        }
        host.commitUpdate(recorder);
    
        return host;
    };
};

function buildRouteMoudleChanges(context: AddRouteModuleContext, host: Tree, options: ModuleOptions): Change[] {

    let text = host.read(context.moduleFilePath);
    if (!text) throw new SchematicsException(`File ${options.module} does not exist.`);
    let sourceText = text.toString('utf-8');

    let sourceFile = ts.createSourceFile(context.moduleFilePath, sourceText, ts.ScriptTarget.Latest, true);

    let nodes = getSourceNodes(sourceFile);

    let assignNodes = nodes.filter(n => n.kind === ts.SyntaxKind.PropertyAssignment);
    let childrenNode = assignNodes.find(n => {
        let identifierNode = n.getChildren().find(c => c.kind === ts.SyntaxKind.Identifier);
        if (!identifierNode) return false;

        return identifierNode.getText() == 'children';
    });
    if (!childrenNode) {
        throw new SchematicsException('children node not find!');
    }

    let listNode = findNodeByPath(childrenNode, [ts.SyntaxKind.ArrayLiteralExpression, ts.SyntaxKind.SyntaxList]);
    if (!listNode) {
        throw new SchematicsException('children node have not list!');
    }

    let listNodes = listNode.getChildren();

    let change: Change;
    if (listNodes.length == 0) {
        let toAdd = `
        { path: '${classify(options.name)}', component: ${classify(options.name)}${classify(options.type || '')}Component}`;
        change = new InsertChange(context.moduleFilePath, listNode.end, toAdd);
    }
    else {
        let lastNode = listNodes[listNodes.length - 1];
        if (lastNode.kind == ts.SyntaxKind.CommaToken) {
            let toAdd = `
            { path: '${classify(options.name)}', component: ${classify(options.name)}${classify(options.type || '')}Component}`;
            change = new InsertChange(context.moduleFilePath, lastNode.end, toAdd);
        }
        else {
            let toAdd = `,
            { path: '${classify(options.name)}', component: ${classify(options.name)}${classify(options.type || '')}Component}`;
            change = new InsertChange(context.moduleFilePath, lastNode.end, toAdd);
        }
    }

    return [
        insertImport(sourceFile, context.moduleFilePath, context.componentName, context.relativeComponentPath),
        change
    ];

}

function findNodeByPath(node: ts.Node, searchPath: ts.SyntaxKind[] ) {
    let children = node.getChildren();
    let next: ts.Node | undefined = undefined;

    for(let syntaxKind of searchPath) {
        next = children.find(n => n.kind == syntaxKind);
        if (!next) return null;
        children = next.getChildren();
    }
    return next;
}