import { Tree, DirEntry, SchematicsException } from "@angular-devkit/schematics";
import { ModuleOptions } from "../schematics-angular-utils/find-module";
import { strings, join, Path } from "@angular-devkit/core";

const dasherize = strings.dasherize;

export function constructDestinationPath(options: ModuleOptions): string {
    
    return (options.path || '') + (options.flat ? '' : '/' + strings.dasherize(options.name));

}

export function findFile(fileName: string, host: Tree, options: ModuleOptions): Path | null {

    const startPath = constructDestinationPath(options);
    let dir: DirEntry | null = host.getDir(startPath);

    while(dir) {
        let file = dir.subfiles.find(f => f == fileName);
        if (file) {
            return join(dir.path, file);
        }
        dir = dir.parent;
    }

    return null;
}

export function findFileByName(fileName: string, path: string, host: Tree): string {
    
    let dir: DirEntry | null = host.getDir(path);

    while(dir) {
        let appComponentFileName = dir.path + '/' + fileName;
        if (host.exists(appComponentFileName)) {
            return appComponentFileName;
        }
        dir = dir.parent;
    }
    throw new SchematicsException(`File ${fileName} not found in ${path} or one of its anchestors`);
}