define(['knockout', 'underscore', 'jquery', 'util', 'LOG', 'zip', 'AMD/file/JsonXmlConverter', 'AMD/VisualMode',
    'AMD/ControlFilter', 'AMD/edit/ControlEditor', 'AMD/Dimensions', 'AMD/LayoutHolder', 'AMD/midi/MidiUtil',
    'AMD/EncodingCheck',
    'AMD/file/SourceFileHolder', 'AMD/file/JsonSanitizer', 'AMD/ControlSelection', 'koToggleableExtender', 'knockoutFastForeach',
    'AMD/knockout/koFaderHandleBinding', 'AMD/knockout/koSvgBindings', 'AMD/knockout/koLogContextBinding',
    'AMD/knockout/koDoubleClickBinding', 'AMD/knockout/koRotaryHandleBinding', 'lib/ko.svgTemplateEngine',
    'AMD/knockout/koFocusAfterRender', 'AMD/knockout/koHighlightControlBinding', 'AMD/knockout/koCountByArrowUpDownBinding'],

    function(ko, _, $, util, LOG, zip, JsonXmlConverter, VisualMode, ControlFilter, ControlEditor,
             Dimensions, LayoutHolder, MidiUtil, EncodingCheck, SourceFileHolder, JsonSanitizer, ControlSelection) {

    'use strict';

    var URL = window.URL || window.webkitURL || window.mozURL;

    /**
     * @constructor
     */
    function App() {
        var self = this,
            modesCounter = 0,
            mode = ko.observable(),
            jsonXmlConverter = JsonXmlConverter.getInstance(),
            createMode = function() {
                var newModeId = ++modesCounter,
                    modeObservable = ko.computed({
                        read: ko.computed(function() {
                            return mode() === newModeId;
                        }),
                        write: function() {
                            mode(newModeId);
                        }
                    });
                modeObservable.MODE_ID = newModeId;
                return modeObservable;
            };

        this.midiUtil = MidiUtil;

        this.layoutHolder = LayoutHolder.getInstance();

        this.sourceFileHolder = SourceFileHolder.getInstance();

        this.exportFilename = ko.observable();

        // pipe sanitizedJson into layoutHolder
        this.sourceFileHolder.sanitizedJson.subscribe(self.layoutHolder.json);

        this.dimensions = Dimensions.getInstance();

        this.visual = new VisualMode();
        this.controlFilter = ControlFilter.getInstance();
        this.controlSelection = ControlSelection.getInstance();
        this.controlEditor = ControlEditor.getInstance();

        this.infoMode = createMode();
        this.detailsMode = createMode();
        this.visualMode = createMode();
        this.exportMode = createMode();
        this.jsonMode = createMode();
        this.sourceXmlMode = createMode();
        this.targetXmlMode = createMode();
        this.tableMode = createMode();
        this.encodingCheckMode = createMode();

        this.isDevModeEnabled = ko.observable(false).extend({toggleable: true});

        var MODES_WITH_FILTER = [self.visualMode, self.tableMode];

        /**
         * Auto-toggle filter
         */
        mode.subscribe(function(newModeId) {
            var isFilterAvailable = _.some(MODES_WITH_FILTER, function(mode) {
                    return mode.MODE_ID === newModeId;
                }),
                isEditorAvailable = isFilterAvailable; // TODO check if filter+editor always come in pair

            self.controlFilter.isVisible(isFilterAvailable);
            self.controlEditor.isVisible(isEditorAvailable);
        });

        this.error = ko.observable();

        this.sourceFileHolder.error.subscribe(this.error);

        this.exportUrl = ko.observable();

        this.encodingCheck = EncodingCheck.getInstance();

        /**
         * Generates the XML from the LayoutHolder's json.
         * @return (Object) sanitized JSON, ready to be zipped to a .touchosc file.
         */
        this.getXmlForExport = function() {
            var jsonForExport = self.layoutHolder.getJsonForExport();

            if (jsonForExport) {
                return jsonXmlConverter.json2xml(jsonForExport);
            } else {
                return '';
            }
        };

        this.startExport = function() {
            self.exportUrl('');

            // use a BlobWriter to store the zip into a Blob object
            zip.createWriter(new zip.BlobWriter(), function(writer) {

                // use a TextReader to read the String to add
                writer.add('index.xml', new zip.TextReader(self.getXmlForExport()), function() {
                    // onsuccess callback
                    // close the zip writer
                    writer.close(function(blob) {
                        // blob contains the zip file as a Blob object
                        var blobUrl = URL.createObjectURL(blob);
                        self.exportUrl(blobUrl);
                        LOG.dev('blobUrl created: ' + blobUrl);
                        _.defer(function() {
                            $('#hiddenExportLink')[0].click();
                        });
                    });
                }, function(currentIndex, totalIndex) {
                    // onprogress callback
                });
            }, function(error) {
                self.error('Error while zipping');
                LOG.error(error);
            });
        };

        // reset when new OSC file is opened
        this.sourceFileHolder.file.subscribe(function(filename) {
            self.encodingCheckMode(true);
            self.exportFilename(filename ? filename.replace(/.+?([^\/\\]+)(.touchosc)$/, '$1--modified$2') : '');
            self.controlSelection.reset();
            self.controlFilter.reset();
        });

        this.gotoTabPage = function(tabPage) {
            self.visual.currentTabPage(tabPage);
            self.visualMode(true);
        };

        // calculate control counts for ControlFilter
        ko.computed(function() {
            var controlBaseTypeCountMap = {},
                json = self.layoutHolder.json(),
                allTabPages = json && json.layout && json.layout.tabpage,
                tabPagesToScan = allTabPages && (self.visualMode() ? [self.visual.currentTabPage()] :
                                                 self.tableMode() ? allTabPages  : null);
            if (tabPagesToScan) {
                _.each(tabPagesToScan, function(tabPage) {
                    _.each(tabPage && tabPage.control, function(control) {
                        var baseTypeName = control.BASE_TYPE_NAME;
                        controlBaseTypeCountMap[baseTypeName] = (controlBaseTypeCountMap[baseTypeName] || 0) + 1
                    });
                });

                self.controlFilter.updateCounts(controlBaseTypeCountMap);
            }
        });

        this.loadDemo = function() {
            $.ajax({
                url: 'resources/demo/demo.xml',
                method: 'get',
                dataType: 'text',
                success: function(demoXml) {
                    self.sourceFileHolder.xml(demoXml);
                    self.exportFilename('demo-modified.touchosc');
                    _.defer(function() {
                        self.controlSelection.reset();
                        self.controlFilter.reset();
                        self.visualMode(true);
                    });
                }
            });
        };

        /**
         * Updates the midi channel in all existing midi objects of all controls.
         * @param newChannel
         */
        this.setGlobalChannel = function(newChannel) {
            util.assertNumberInRange(newChannel, 1, 16, 'Invalid channel for setGlobalChannel: {}', newChannel);
            if (!confirm('Set channel ' + newChannel + ' on all controls?')) {
                return;
            }

            self.layoutHolder.forEachControl(function(control) {
                _.each(control.props.midi, function(midiObj) {
                    var msgType = MidiUtil.MessageTypes.byId[midiObj._type];
                    if (msgType && !msgType.hasFixChannel && typeof midiObj._channel !== 'undefined') {
                        midiObj._channel = newChannel;
                    }
                });
            });

            self.layoutHolder.triggerRedraw();
        };

        this.prettyTimecode = function(timecode) {
            util.assertNumber(timecode, 'Invalid timecode for prettyTimecode()');
            var d = new Date(timecode),
                dateStr = (d.toLocaleDateString && d.toLocaleDateString()) || '',
                timeStr = (d.toLocaleTimeString && d.toLocaleTimeString()) || d.toString();

            return dateStr + ' ' + timeStr;
        };

        this.infoMode(true);
    }

    return {
        init: function() {
            ko.applyBindings(new App());
        }
    };
});