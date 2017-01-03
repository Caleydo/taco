/**
 * Created by Holger Stitz on 25.08.2016.
 */

import 'file-loader?name=index.html!extract-loader!html-loader!./index.html';
import 'file-loader?name=404.html!./404.html';
import 'file-loader?name=robots.txt!./robots.txt';
import 'phovea_ui/src/_bootstrap';
import 'phovea_ui/src/_font-awesome';
import './style.scss';

import * as app from './app';
import * as header from 'phovea_ui/src/header';
import {Language} from './language';

header.create(
  <HTMLElement>document.querySelector('#caleydoHeader'),
  { appLink: new header.AppHeaderLink(Language.APP_NAME) }
);

const parent = document.querySelector('#app');
app.create(parent).init();

