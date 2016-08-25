/**
 * Created by Holger Stitz on 25.08.2016.
 */
define(["require", "exports", './Taco', "css!/bower_components/bootstrap/dist/css/bootstrap", "font-awesome", "css!../caleydo_bootstrap_fontawesome/style.css"], function (require, exports, taco) {
    "use strict";
    var parent = document.querySelector('#taCoApp');
    taco.create(parent);
});
//# sourceMappingURL=main.js.map