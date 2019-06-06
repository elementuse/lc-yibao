import { channelObjectMapSource} from '@app/yibao/enums/channelObjectMapSource'
import { channelObjectState } from '@app/yibao/enums/channelObjectState';

export interface queryChannelObjectInput {
    channel:string,
    objectType:string,
    keyword:string,
    source:channelObjectMapSource,
    registered:boolean,
    state:channelObjectState,
    maxResultCount:number,
    skipCount:number

}