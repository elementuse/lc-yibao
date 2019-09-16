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

export function addComponentIntoRouteMoudle(modulePath: string, componentName: string, componentPath: string, childPath: string, path: string = ''): Rule {
    return (host: Tree) => {
        let changes = buildRouteMoudleChanges(host, modulePath, componentName, componentPath, childPath, path);
        
        const recorder = host.beginUpdate(modulePath);
        for (let change of changes) {
            if (change instanceof InsertChange) {
                recorder.insertLeft(change.pos, change.toAdd);
            }
        }
        host.commitUpdate(recorder);
    
        return host;
    };
};

function buildRouteMoudleChanges(host: Tree, modulePath: string, componentName: string, componentPath: string, childPath: string, path: string): Change[] {
    let text = host.read(modulePath);
    if (!text) throw new SchematicsException(`File ${modulePath} does not exist.`);
    let sourceText = text.toString('utf-8');

    let sourceFile = ts.createSourceFile(modulePath, sourceText, ts.ScriptTarget.Latest, true);

    let nodes = getSourceNodes(sourceFile); 

    // let routeNode = nodes.find(n => n.kind == ts.SyntaxKind.TypeReference);

    // showTree(nodes[0]);
    let type = "TypeReference";
    let tf = ts.SyntaxKind[type as keyof typeof ts.SyntaxKind];
    console.log("TypeReference:", tf === ts.SyntaxKind.TypeReference);
    console.log("TypeReference22:", tf === ts.SyntaxKind.ClassDeclaration);


    // let assignNodes = nodes.filter(n => n.kind === ts.SyntaxKind.PropertyAssignment);
    // let childrenNode = assignNodes.find(n => {
    //     let identifierNode = n.getChildren().find(c => c.kind === ts.SyntaxKind.Identifier);
    //     if (!identifierNode) return false;

    //     return identifierNode.getText() == 'children';
    // });
    // if (!childrenNode) {
    //     throw new SchematicsException('children node not find!');
    // }

    // let listNode = findNodeByPath(childrenNode, [ts.SyntaxKind.ArrayLiteralExpression, ts.SyntaxKind.SyntaxList]);
    // if (!listNode) {
    //     throw new SchematicsException('children node have not list!');
    // }

    // let listNodes = listNode.getChildren();

    // let change: Change;
    // if (listNodes.length == 0) {
    //     let toAdd = `
    //     { path: '${classify(options.name)}', component: ${classify(options.name)}${classify(options.type || '')}Component}`;
    //     change = new InsertChange(context.moduleFilePath, listNode.end, toAdd);
    // }
    // else {
    //     let lastNode = listNodes[listNodes.length - 1];
    //     if (lastNode.kind == ts.SyntaxKind.CommaToken) {
    //         let toAdd = `
    //         { path: '${classify(options.name)}', component: ${classify(options.name)}${classify(options.type || '')}Component}`;
    //         change = new InsertChange(context.moduleFilePath, lastNode.end, toAdd);
    //     }
    //     else {
    //         let toAdd = `,
    //         { path: '${classify(options.name)}', component: ${classify(options.name)}${classify(options.type || '')}Component}`;
    //         change = new InsertChange(context.moduleFilePath, lastNode.end, toAdd);
    //     }
    // }

    return [
        // insertImport(sourceFile, context.moduleFilePath, context.componentName, context.relativeComponentPath),
        // change
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

function showTree(node: ts.Node, depth: number = 0): void {
    let indent = ''.padEnd(depth*4, ' ');
    console.log(indent + ts.SyntaxKind[node.kind]);
    if (node.getChildCount() === 0) {
        console.log(indent + '    Text: ' + node.getText());
    }

    for(let child of node.getChildren()) {
        showTree(child, depth+1);
    }
}