define(['jquery', 'underscore', 'LOG', 'util'], function($, _, LOG, util) {

    'use strict';

    var instance = null;

    /**
     * @constructor
     */
    function SvgControlTemplates() {
        var templateId2ControlTypeRegex = {},
            fallbackControlTemplateId = null;

        this.getTemplateIdForControlType = function(typeId) {
            var matchingTempatesIds = _.chain(templateId2ControlTypeRegex).map(function(regex, templateId) {
                                          return regex.test(typeId) ? templateId : null;
                                      }).compact().value();

            util.assert(matchingTempatesIds.length < 2, 'Multiple svg templates found for typeId "{}": {}', typeId, matchingTempatesIds);
            return matchingTempatesIds[0] || fallbackControlTemplateId;
        };


        $('script.svg__controlTemplate').each(function() {
            var scriptId = this.id,
                supportedTypesPattern = this.getAttribute('data-typepattern'),
                isFallbackScript = (supportedTypesPattern === ''),
                supportedTypesRegex = !isFallbackScript && new RegExp(supportedTypesPattern);

            if (isFallbackScript) {
                fallbackControlTemplateId = scriptId;
                LOG.dev('Found SVG fallback template "%s"', scriptId);
            } else {
                templateId2ControlTypeRegex[scriptId] = supportedTypesRegex;
            }
        });

        util.assertString(fallbackControlTemplateId, 'SvgControlTemplates could not find any fallback template!');
    }

    return {
        getInstance: function() {
            if (!instance) {
                instance = new SvgControlTemplates();
            }
            return instance;
        }
    };

});