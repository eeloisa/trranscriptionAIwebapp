import { Login } from './../../../common/model/login.model';
import { Component, NgZone } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { NbDialogService } from '@nebular/theme';
import {
  ref,
  uploadBytesResumable,
  UploadTaskSnapshot,
  StorageError,
} from 'firebase/storage';
import { identifyMediaFormat } from 'src/app/common/enums/media-format.enum';
import {
  MediaTypeEnum,
  mediaTypeLabel,
} from 'src/app/common/enums/media-type.enum';
import {
  TranscriptionStatusEnum,
  transcriptionStatusLabel,
} from 'src/app/common/enums/transcription-status.enum';
import { ConfirmComponent } from 'src/app/common/layout/confirm/confirm.component';
import { AccountPayload } from 'src/app/common/payload/account.payload';
import { MediaPayload } from 'src/app/common/payload/group-media.payload';
import { LoadingService } from 'src/app/common/services/loading.service';
import { environment } from 'src/environments/environment';
import { Media } from '../../group-media/group-media.model';
import { MediaComponent } from '../../group-media/media-view/media.component';
import { Account, Profile, Role } from '../account.model';
import { AccountService } from '../../../common/services/account.service';
import { Parameter } from '../../parameter/parameter.model';
import { ParameterService } from '../../parameter/parameter.service';
import { UserParameterService } from '../user-parameter.service';
import { UserParameter } from '../user-parameter.model';

@Component({
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss'],
})
export class UserComponent {
  account: Account = new Account();
  accountId: string = null;

  profiles: Profile[];

  displayedParamColumns: string[] = [
    'name',
    'description',
    'value',
    'actions',
  ];

  password: string = null;
  confirmPassword: string = null;

  newMidias: Media[] = [];

  roles: string[] = [];

  isChangePassword = false;

  constructor(
    private service: AccountService,
    private router: Router,
    private route: ActivatedRoute,
    private userParamService: UserParameterService,
    private dialogService: NbDialogService
  ) {
    this.route.params.subscribe((params) => (this.accountId = params['id']));

    if (this.isEdit()) {
      this.service.getById(this.accountId).subscribe((data) => {
        if (data == undefined) {
          //ERROR
          return;
        }

        this.account = data;
      });
    } else {
      this.isChangePassword = true;
    }

    this.service.getProfiles().subscribe((data) => (this.profiles = data));
  }

  mediaTypeLabel(value: MediaTypeEnum) {
    return mediaTypeLabel(value);
  }

  isEdit() {
    return this.accountId != null && this.account != undefined;
  }

  changePassword(checked: boolean) {
    if (!checked) {
      this.password = null;
    }

    this.isChangePassword = checked;
  }

  confirmedPassword(): boolean {
    if (this.password == null || this.password == '') {
      return true;
    }

    return this.password == this.confirmPassword;
  }

  toSave() {
    let accountPayload = new AccountPayload();

    accountPayload.accountId = this.account.accountId;
    accountPayload.profileId = this.account.profileId;
    accountPayload.login = this.account.accountLogin;
    accountPayload.name = accountPayload.accountName = this.account.accountName;
    accountPayload.password = this.password;

    this.service.save(accountPayload).subscribe((res) => {
      this.router.navigate(['/user-list']);
    });
  }

  getRoles(): any[] {
    if (this.account.profileId == null || this.account.profileId == '' || this.profiles == null) {
      return [];
    }

    return this.profiles.find((p) => p.id == this.account.profileId)?.roles;
  }

  goBack() {
    this.router.navigate(['/user-list']);
  }

  isFormDisabled(): boolean {
    return (
      this.account.accountLogin == null ||
      this.account.accountLogin.trim() == '' ||
      this.account.accountName == null ||
      this.account.accountName.trim() == '' ||
      this.account.profileId == null ||
      !this.validatePassword()
    );
  }

  validatePassword(): boolean {
    if (this.isChangePassword) {
      return (
        this.password != null &&
        this.password.trim() != '' &&
        this.confirmedPassword()
      );
    }

    return true;
  }

  onParamSave(obj: UserParameter) {
    this.dialogService
      .open(ConfirmComponent, {
        context: {
          modalData: 'Salvar a Alteração?',
        },
      })
      .onClose.subscribe((confirm) => {
        if (confirm) {
          this.userParamService.patch(obj).subscribe((res) => {});
        }
      });
  }

  isParamSaveDisabled(parameter: UserParameter): boolean{
    return parameter.value == null || parameter.value.trim() == "";
  }
}