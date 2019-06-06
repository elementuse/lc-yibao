import { channelDataModel } from './channeldataModel'

export interface diagnoseModel{
    name:string,
    id?:string,
    diagnose?:string,
    channelData:channelDataModel
}