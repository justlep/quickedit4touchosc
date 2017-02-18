define(['X2JS', 'util'], function(X2JS, util) {
    "use strict";

    var instance;

    function JsonXmlConverter() {
        var XML_HEADER = '<?xml version="1.0" encoding="UTF-8"?>',
            x2js = new X2JS({
                skipEmptyTextNodesForObj: false,
                useDoubleQuotes : true,
                arrayAccessFormPaths: [
                    'layout.tabpage',
                    'layout.tabpage.control',
                    'layout.tabpage.control.midi'
                ]
            });

        this.xml2json = function(xml) {
            util.assertStringOrEmpty(xml, 'Invalid xml for JsonXmlConverter.xml2json');
            return xml ? x2js.xml_str2json(xml) : null;
        };

        /**
         * @param json (Object)
         * @param [noXmlHeader] (boolean) if true, no <?xml .. header is added
         */
        this.json2xml = function(json, noXmlHeader) {
            util.assertObjectOrEmpty(json, 'Invalid json for JsonXmlConverter.xml2json');
            var xmlHeader = noXmlHeader ? '' : XML_HEADER;
            return json ? (xmlHeader + x2js.json2xml_str(json)) : '';
        };
    }

    return {
        getInstance: function() {
            if (!instance) {
                instance = new JsonXmlConverter();
            }
            return instance;
        }
    };

});