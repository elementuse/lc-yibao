import {channelObjectInput} from '@app/yibao/models/channelObjectInput';

export interface registeredChannelObjectInput extends channelObjectInput{
    sourceId? :number,
    hisObjectId:string,
    hisObjectName:string,
    registerState?:number
}