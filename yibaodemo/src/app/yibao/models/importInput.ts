export interface importInput<T>{
    channel:string,
    objectType:string,
    objectSubType:string,
    fieldsWriteModeFieldsWriteMode:number,
    importTime?:any,
    channelObjects:Array<T>;

} 