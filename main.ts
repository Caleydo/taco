/**
 * Created by Holger Stitz on 25.08.2016.
 */

// Determine the order of css files manually

// HACK! because <amd-dependency path="bootstrap" /> is loaded after all the other stylesheets and not before (as declared)
/// <amd-dependency path="css!/bower_components/bootstrap/dist/css/bootstrap.min" />

/// <amd-dependency path="font-awesome" />
/// <amd-dependency path="css!../caleydo_bootstrap_fontawesome/style.css" />


import taco = require('./Taco');
import header = require('../caleydo_bootstrap_fontawesome/header');

const parent = document.querySelector('#taCoApp');

header.create(
  <HTMLElement>document.querySelector('#caleydoHeader'),
  { appLink: new header.AppHeaderLink('TaCo') }
);

taco.create(parent);
