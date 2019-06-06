import { IChannelObjectDto } from "@shared/service-proxies/service-proxies";

export interface IChargeItemService {
    RegisterToYibao(item: IChannelObjectDto): Promise<void>;
    UpdateToYibao(item: IChannelObjectDto): Promise<void>;
    UnRegisterToYibao(item: IChannelObjectDto): Promise<void>;
    ApproveToYibao(item: IChannelObjectDto): Promise<boolean>;
}