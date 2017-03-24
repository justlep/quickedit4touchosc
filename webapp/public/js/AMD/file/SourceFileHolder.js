define(['knockout', 'underscore', 'jquery', 'LOG', 'util', 'zip', 'AMD/file/JsonXmlConverter', 'AMD/file/JsonSanitizer',
        'AMD/control/ControlSupport'],
    function(ko, _, $, LOG, util, zip, JsonXmlConverter, JsonSanitizer, ControlSupport) {

    'use strict';

    var instance,
        OSC_FILE_HTML_INPUT_SELECTOR = '#touchosc__file',
        CHANGE_LOSS_WARNING = 'All changes will be lost. Do anyway?';

    /**
     * @constructor
     */
    function SourceFileHolder() {
        var self = this,
            jsonXmlConverter = JsonXmlConverter.getInstance(),
            _file = ko.observable(),
            _invertTextsNeedEncoding = ko.observable(false),
            _invertNamesNeedEncoding = ko.observable(false);

        this.file = ko.computed({
            read: _file,
            write: function(newFile) {
                if (newFile) {
                    _file(newFile);
                }
            }
        });

        this.xml = ko.observable().extend({deferred: true});
        this.error = ko.observable().extend({deferred: true});
        this.encodingInfo = ko.observable();

        this.tryAutoFixTexts = function() {
            var xml = self.xml();
            if (xml && confirm(CHANGE_LOSS_WARNING)) {
                _invertTextsNeedEncoding(!_invertTextsNeedEncoding());
                self.xml(xml + ' ');
            }
        };
        this.tryAutoFixNames = function() {
            var xml = self.xml();
            if (xml && confirm(CHANGE_LOSS_WARNING)) {
                _invertNamesNeedEncoding(!_invertNamesNeedEncoding());
                self.xml(xml + ' ');
            }
        };

        /**
         * Updates the `xml` observable using the XMl from the selected TouchOSC file.
         */
        this.file.subscribe(function(filename) {
            self.xml('');
            self.error('');
            _invertTextsNeedEncoding(false);
            _invertNamesNeedEncoding(false);

            var file = $(OSC_FILE_HTML_INPUT_SELECTOR)[0].files[0];
            if (!file) {
                self.error('Please select a file.');
                return;
            }

            // http://gildas-lormeau.github.io/zip.js/core-api.html#zip-reading-example

            zip.createReader(new zip.BlobReader(file), function(zipReader) {
                zipReader.getEntries(function(entries) {
                    var indexXmlEntry = _.find(entries, function(entry) {
                        return !entry.directory && /(^|\/)index.xml$/.test(entry.filename);
                    });

                    if (indexXmlEntry) {
                        indexXmlEntry.getData(new zip.TextWriter(), function(text) {
                            self.xml(text);
                            zipReader.close(function() {
                                LOG.dev('zipReader closed.');
                            });
                        }, function(current, total) {
                            // progress callback
                        });
                    } else {
                        self.error('No index.xml found');
                        zipReader.close(function() {
                            LOG.dev('zipReader closed.');
                        });
                    }
                });
            }, function(e) {
                self.error(e);
                LOG.error(e);
            });

        });

        /**
         * Create the sanitized json when the `xml` changes.
         */
        this.sanitizedJson = ko.pureComputed(function() {
            var xml = self.xml(),
                json = xml && jsonXmlConverter.xml2json(xml);

            if (json && xml) {
                var encodingInfo = {
                        namesNeedDecoding: (/ name="[a-z0-9\-]+={1,2}"/i).test(xml),
                        textsNeedDecoding: (/ text="[a-z0-9\-]+={1,2}"/i).test(xml)
                    },
                    encodingInfoForSanitizer = _.extend({}, encodingInfo, {
                        namesNeedDecoding: encodingInfo.namesNeedDecoding !== _invertNamesNeedEncoding.peek(),
                        textsNeedDecoding: encodingInfo.textsNeedDecoding !== _invertTextsNeedEncoding.peek()
                    });

                self.encodingInfo(encodingInfo);

                JsonSanitizer.sanitizeJsonAfterImport(json, encodingInfoForSanitizer);

                _.each(json.layout.tabpage, function(tabPage) {
                    tabPage.control = _.map(tabPage.control, ControlSupport.createControlByJson);
                });
            }

            return json;
        });
    }

    return {
        getInstance: function() {
            if (!instance) {
                instance = new SourceFileHolder();
            }
            return instance;
        }
    };

});