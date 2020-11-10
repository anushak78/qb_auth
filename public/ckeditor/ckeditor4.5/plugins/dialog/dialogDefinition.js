/*
 Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 For licensing, see LICENSE.md or http://ckeditor.com/license
*/
CKEDITOR.on('dialogDefinition', function (ev) {
              var dialogName = ev.data.name;
              var dialog = ev.data.definition.dialog;

              if (dialogName == 'image') {
                  dialog.on('show', function () {
                      this.selectPage('Upload');
                  });
              }
          });