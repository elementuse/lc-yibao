import { Tree, SchematicsException, Rule, DirEntry } from "@angular-devkit/schematics";
import { ModuleOptions, buildRelativePath } from "../schematics-angular-utils/find-module";
import * as ts from 'typescript';
import { insertImport } from "../schematics-angular-utils/route-utils";
import { getSourceNodes } from "../schematics-angular-utils/ast-utils";
import { Change, InsertChange, NoopChange } from "../schematics-angular-utils/change";
import { constructDestinationPath, findFileByName } from "./find-file";
import { strings, normalize, join } from '@angular-devkit/core';


const classify = strings.classify;
const dasherize = strings.dasherize;
const camelize = strings.camelize;

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
        console.log("AddRouteModuleContext:", context);

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
    console.log(nodes.length);
    showTree(nodes[1]);

    // let ctorNode = nodes.find(n => n.kind == ts.SyntaxKind.Constructor);
    
    // let constructorChange: Change;

    // if (!ctorNode) {
    //     // No constructor found
    //     constructorChange = createConstructorForInjection(context, nodes, options);
    // } 
    // else { 
    //     constructorChange = addConstructorArgument(context, ctorNode, options);
    // }

    return [
        insertImport(sourceFile, context.moduleFilePath, context.componentName, context.relativeComponentPath)
    ];

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