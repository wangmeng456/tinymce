/**
 * Copyright (c) Tiny Technologies, Inc. All rights reserved.
 * Licensed under the LGPL or a commercial license.
 * For LGPL see License.txt in the project root for license information.
 * For commercial licenses see https://www.tiny.cloud/
 */

import { Cell } from '@ephox/katamari';
import PluginManager from 'tinymce/core/api/PluginManager';
import * as Api from './api/Api';
import * as Commands from './api/Commands';
import * as Buttons from './ui/Buttons';
import * as Settings from './api/Settings';
import Editor from 'tinymce/core/api/Editor';

export default function () {
  PluginManager.add('fullscreen', (editor: Editor) => {
    const fullscreenState: Cell<any> = Cell(null);

    if (Settings.getInline(editor)) {
      return Api.get(fullscreenState);
    }

    Commands.register(editor, fullscreenState);
    Buttons.register(editor, fullscreenState);

    editor.addShortcut('Meta+Shift+F', '', 'mceFullScreen');

    return Api.get(fullscreenState);
  });
}
