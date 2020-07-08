/**
 * Created by Holger Stitz on 25.08.2016.
 */
import './404.html';
import './robots.txt';
import 'phovea_ui/dist/webpack/_bootstrap';
import 'phovea_ui/dist/webpack/_font-awesome';
import './scss/main.scss';
import { I18nextManager } from 'phovea_core';
import { App } from './app/App';
import { AppHeader, AppHeaderLink } from 'phovea_ui';
import { Language } from './app/Language';
I18nextManager.getInstance().initI18n().then(() => {
    AppHeader.create(document.querySelector('#caleydoHeader'), {
        appLink: new AppHeaderLink(Language.APP_NAME, (evt) => {
            window.location.hash = '';
            window.location.reload();
            return false;
        })
    });
    const parent = document.querySelector('#app');
    App.create(parent).init();
});
//# sourceMappingURL=initialize.js.map
