import { Component, OnInit, Input,ViewChild } from '@angular/core';
import { ModalDirective } from 'ngx-bootstrap';


@Component({
    selector:'importErrorModal',
    templateUrl: './import-error-modal.component.html',
})
export class ImportErrorModalComponent implements OnInit {
    constructor() { }

    ngOnInit(): void {
    }

    @Input() items:any;
    @ViewChild('importErrorModal') modal: ModalDirective;


    show(): void {
        const self = this;
        self.modal.show();
    }

    close(): void {
        this.modal.hide();
    }
}
