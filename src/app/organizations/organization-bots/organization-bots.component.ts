import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Component, OnInit, TemplateRef, Input, ViewChild } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { ToastrService } from 'ngx-toastr';
import { BotsRestService, Bot } from '@aitheon/communications'
import { GenericConfirmComponent } from '../../shared/generic-confirm/generic-confirm.component';
import { environment } from 'environments/environment';

@Component({
  selector: 'ai-organization-bots',
  templateUrl: './organization-bots.component.html',
  styleUrls: ['./organization-bots.component.scss']
})
export class OrganizationBotsComponent implements OnInit {

  @Input() organizationId: string;
  @ViewChild('genericConfirm') genericConfirm: GenericConfirmComponent;
  @ViewChild('botFormModal') botFormModalRef: TemplateRef<any>;

  constructor(private toastr: ToastrService,
              private modalService: BsModalService,
              private botsService: BotsRestService,
              private fb: FormBuilder) {}

  botsList: Bot[] = [];
  filteredBots: Bot[] = [];
  botFormModal: BsModalRef;
  loading = true;
  searchText: string = '';
  botForm: FormGroup;
  submitted: boolean = false;
  username = /^$|(?=^[\w-]{3,20}$)[a-zA-Z0-9-]+(?:[_ -]?[a-zA-Z0-9-])*$/;
  currentBot: any;
  isEditMode: boolean = false;
  handleErrorText: string;

  ngOnInit() {
    if (!environment.production && this.organizationId) {
      this.botsService.defaultHeaders = this.botsService.defaultHeaders.set('organization-id', this.organizationId);
    }

    this.buildForm();
    this.loadBots();
  }

  onSearchTextChange() {

    if (!this.searchText || this.searchText.trim() === '') {
      this.searchText = '';
      this.filteredBots = [...this.botsList];
      return;
    }

    const text = this.searchText.toLowerCase();
    this.filteredBots = this.botsList.filter(m =>  {
      if (m.username.toLowerCase().includes(text)) {
        return m;
      }
    });
  }

  loadBots() {
    this.loading = true;
    this.botsService.list().subscribe((res: any) => {
      this.botsList = res.payload;
      this.filteredBots = res.payload;
      this.loading = false;
    })

  }

  buildForm() {
    this.botForm = this.fb.group({
      name: [this.currentBot ? this.currentBot.firstName : '', [Validators.required]],
      username: [this.currentBot ? this.currentBot.username : '', [Validators.required, Validators.pattern(this.username)]],
      description: [this.currentBot ? this.currentBot.description : '', []],
    });
    if (this.currentBot) {
      this.botForm.get('username').disable();
    }
    this.handleErrorText = '';
  }

  openBotFormModal() {
    this.botFormModal = this.modalService.show(this.botFormModalRef);
  }

  editBot(bot: Bot) {
    this.currentBot = bot;
    this.isEditMode = true;
    this.buildForm();
    this.openBotFormModal();
  }

  close() {
    this.currentBot = null;
    this.buildForm();
    this.botFormModal.hide();
    this.submitted = false;
    this.handleErrorText = '';
  }

  addBot(form: any) {
    this.submitted = true;

    if (!this.botForm.valid) {
      return
    }

    let bot = {
      firstName: form.name,
      username: form.username,
      description: form.description
    };

    this.botsService.create(bot).subscribe(res => {
      this.submitted = false;
      this.toastr.success('New bot added');
      this.close();
      this.loadBots();
    }, error => this.handleError(error));
  }

  updateBot(form: any, currentBot: Bot) {
    this.submitted = true;

    if (!this.botForm.valid) {
      return
    }

    let bot = {
      firstName: form.name,
      username: form.username,
      description: form.description
    };

    this.botsService.edit(currentBot._id, bot).subscribe(res => {
      this.submitted = false;
      this.toastr.success('Bot updated');
      this.close();
      this.loadBots();
    }, error => {
      this.handleError(error);
    });
  }

  removeBot(bot: Bot) {
    this.genericConfirm.show({ text: `Are you sure you want to remove ${bot.firstName} ${bot.lastName} from organization?`,
    headlineText: 'Remove bot',
    confirmText: 'Ok', cancelText: 'Cancel', callback: () => {
      this.botsService._delete(bot._id).subscribe(res => {;
        this.currentBot = null;
        this.toastr.success(`${bot.firstName} ${bot.lastName} removed`);
        this.loadBots();
      });
    }});
  }

  handleError(error: any) {
    if (error.status == 409) {
      this.handleErrorText = 'Bot username is already exist';
      this.toastr.error(this.handleErrorText);
    } else {
      this.toastr.error(error.message || error);
    }
  }
}
