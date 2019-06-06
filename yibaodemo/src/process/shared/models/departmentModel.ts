import { channelDataModel } from './channeldataModel'

export interface departmentModel{
    name:string,
    id?:string,
    channelData:channelDataModel
}