/**
 * Copyright (c) Tiny Technologies, Inc. All rights reserved.
 * Licensed under the LGPL or a commercial license.
 * For LGPL see License.txt in the project root for license information.
 * For commercial licenses see https://www.tiny.cloud/
 */

import PluginManager from 'tinymce/core/api/PluginManager';
import { window } from '@ephox/dom-globals';

const hasProPlugin = function (editor) {
  // draw back if power version is requested and registered
  if (/(^|[ ,])tinymcespellchecker([, ]|$)/.test(editor.settings.plugins) && PluginManager.get('tinymcespellchecker')) { // editor.settings.plugins not changed to editor.getParam due to being alien.

    if (typeof window.console !== 'undefined' && window.console.log) {
      window.console.log(
        `Spell Checker Pro is incompatible with Spell Checker plugin! ` +
        `Remove 'spellchecker' from the 'plugins' option.`
      );
    }
    return true;
  } else {
    return false;
  }
};

export {
  hasProPlugin
};
