/**
 * Created by Holger Stitz on 25.08.2016.
 */

import 'file-loader?name=index.html!extract-loader!html-loader!./index.html';
import 'file-loader?name=404.html!./404.html';
import 'file-loader?name=robots.txt!./robots.txt';
import 'phovea_ui/src/_bootstrap';
import 'phovea_ui/src/_font-awesome';
import './style.scss';
import {I18nextManager} from 'phovea_core';

import * as app from './app';
import {AppHeader, AppHeaderLink} from 'phovea_ui';
import {Language} from './language';

I18nextManager.getInstance().initI18n().then(() => {
  AppHeader.create(
    <HTMLElement>document.querySelector('#caleydoHeader'),
    {
      appLink: new AppHeaderLink(Language.APP_NAME, (evt) => {
        window.location.hash = '';
        window.location.reload();
        return false;
      })
    }
  );

  const parent = document.querySelector('#app');
  app.create(parent).init();
});

