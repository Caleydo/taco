/**
 * Created by Holger Stitz on 25.08.2016.
 */

import 'file?name=index.html!./index.html';
import 'file?name=404.html!./404.html';
import 'file?name=robots.txt!./robots.txt';
import 'phovea_bootstrap_fontawesome/src/_bootstrap';
import 'phovea_bootstrap_fontawesome/src/_font-awesome';
import './style.scss';

import * as app from './app';
import * as header from 'phovea_bootstrap_fontawesome/src/header';
import {Language} from './language';

header.create(
  <HTMLElement>document.querySelector('#caleydoHeader'),
  { appLink: new header.AppHeaderLink(Language.APP_NAME) }
);

const parent = document.querySelector('#app');
app.create(parent).init();

