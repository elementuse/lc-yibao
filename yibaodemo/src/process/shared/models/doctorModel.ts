import { channelDataModel } from './channeldataModel'

export interface doctorModel{
    id:string,
    channelData:channelDataModel,
    name?:string
}