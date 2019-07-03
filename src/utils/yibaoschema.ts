export interface YibaoSchema {
  
    project: string;

    /** channel name */
    name: string;

    /** channel display name */
    display: string;

    type?: string;
    path?: string;
    module?: string;

    sourcePath?: string;
  }