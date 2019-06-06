export interface getImportInfoInput{
    channel:string,
    objectType:string,
    objectSubType:string,
    registered:boolean,
    initialDate:number //0:2000年开始, 1:tenant创建时间开始
}