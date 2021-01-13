/**
 * Created by Holger Stitz on 25.08.2016.
 */

import {I18nextManager} from 'phovea_core';

import {App} from './app/App';
import {AppHeader, AppHeaderLink} from 'phovea_ui';
import {Language} from './app/Language';

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
  App.create(parent).init();
});
