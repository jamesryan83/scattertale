/**
 * @license Copyright (c) 2003-2015, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

CKEDITOR.editorConfig = function( config ) {


	config.extraPlugins = 'sharedspace,indentlist,indentblock,sourcedialog,richcombo,format,panel,floatpanel,listblock,uploadwidget,widget,filetools,notificationaggregator,notification,lineutils,toolbar,button';

	config.toolbar = [
    {
        name: 'main',
        items: [ 'Cut', 'Copy', 'Paste', '-', 'Undo', 'Redo', 'Bold', 'Italic', 'Underline',
                'Strike', 'Subscript', 'Superscript', 'NumberedList', 'BulletedList', '-',
                'Outdent', 'Indent', 'Link', 'Unlink', 'Anchor', 'About', 'Sourcedialog', 'Format']
    }];

    config.removePlugins = 'resize';

    CKEDITOR.editorConfig = function(config) {
        config.allowedContent = true;
    }
};
