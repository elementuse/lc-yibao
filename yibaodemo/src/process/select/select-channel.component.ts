import { Component, OnInit } from '@angular/core';
import { ProcessServiceProxy, ProcessChooseChannelInput, MetadataServiceProxy } from '@shared/service-proxies/service-proxies';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-select-channel',
  templateUrl: './select-channel.component.html',
  styleUrls: ['./select-channel.component.css']
})
export class SelectChannelComponent implements OnInit {

  public channels: string[];
  protected subscription: Subscription;
  private userid: string;
  private processid: string;
  private enumDict:any;

  constructor(
    private progressservice: ProcessServiceProxy,
    private metadataService: MetadataServiceProxy,
    protected activatedRoute: ActivatedRoute,
    protected router: Router
  ) {
    this.subscription = this.activatedRoute.queryParams.subscribe(
      (queryParams: any) => {
        if (queryParams.userId) {
          this.userid = queryParams.userId;
        }
        this.processid = queryParams.processId;
      }
    );
  }

  async ngOnInit() {
    this.enumDict = await this.metadataService.getEnums().toPromise();
    this.channels = await this.progressservice.getAvailableChannels(this.processid).toPromise();
  }

  public async chooseChannel(channel: string): Promise<any> {
    var input = new ProcessChooseChannelInput();
    input.channel = channel;
    input.processId = this.processid;
    await this.progressservice.chooseProcessChannel(input).toPromise();
    this.router.navigate([`process/${channel}`],{queryParams:{processId:this.processid,userId:this.userid}});
  }
}
