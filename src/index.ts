/**
 * Created by Holger Stitz on 25.08.2016.
 */

import 'file-loader?name=index.html!extract-loader!html-loader!./index.html';
import 'file-loader?name=404.html!./404.html';
import 'file-loader?name=robots.txt!./robots.txt';
import 'phovea_ui/src/_bootstrap';
import 'phovea_ui/src/_font-awesome';
import './style.scss';
import {initI18n} from 'phovea_core/src/i18n';

import * as app from './app';
import * as header from 'phovea_ui/src/header';
import {Language} from './language';

initI18n().then(() => {
  header.create(
    <HTMLElement>document.querySelector('#caleydoHeader'),
    {
      appLink: new header.AppHeaderLink(Language.APP_NAME, (evt) => {
        window.location.hash = '';
        window.location.reload();
        return false;
      })
    }
  );

  const parent = document.querySelector('#app');
  app.create(parent).init();
});

