(function (angular) {
    "use strict";
    angular.module("framework.directives.UI").constant('ipnConfig', {
        allowExtensions: false,
        autoFormat: true,
        autoHideDialCode: true,
        autoPlaceholder: true,
        customPlaceholder: null,
        defaultCountry: "",
        geoIpLookup: null,
        nationalMode: true,
        numberType: "MOBILE",
        onlyCountries: void 0,
        preferredCountries: ['gb'],
        skipUtilScriptDownload: false,
        utilsScript: ""
    }).directive('internationalPhoneNumber', ['$timeout', 'ipnConfig',
        function ($timeout, ipnConfig) {
            return {
                restrict: 'A',
                require: '^ngModel',
                scope: {
                    ngModel: '=',
                    country: '='
                },
                link: function (scope, element, attrs, ctrl) {
                    var handleWhatsSupposedToBeAnArray, options, read, watchOnce;
                    if (ctrl) {
                        if (element.val() !== '') {
                            $timeout(function () {
                                element.intlTelInput('setNumber', element.val());
                                return ctrl.$setViewValue(element.val());
                            }, 0);
                        }
                    }
                    read = function () {
                        if (!element.val()) {
                            ctrl.$setViewValue('0');
                            $timeout(function () {
                                return ctrl.$setViewValue('');
                            }, 0);
                        } else {
                            ctrl.$setViewValue(element.val());
                        }
                        console.log(element.val() + '-' + ctrl.$modelValue);
                    };
                    handleWhatsSupposedToBeAnArray = function (value) {
                        if (value instanceof Array) {
                            return value;
                        } else {
                            return value.toString().replace(/[ ]/g, '').split(',');
                        }
                    };
                    options = angular.copy(ipnConfig);
                    angular.forEach(options, function (value, key) {
                        var option;
                        if (!(attrs.hasOwnProperty(key) && angular.isDefined(attrs[key]))) {
                            return;
                        }
                        option = attrs[key];
                        if (key === 'preferredCountries') {
                            return options.preferredCountries = handleWhatsSupposedToBeAnArray(option);
                        } else if (key === 'onlyCountries') {
                            return options.onlyCountries = handleWhatsSupposedToBeAnArray(option);
                        } else if (typeof value === "boolean") {
                            return options[key] = option === "true";
                        } else {
                            return options[key] = option;
                        }
                    });
                    watchOnce = scope.$watch('ngModel', function (newValue) {
                        return scope.$$postDigest(function () {
                            if (newValue !== null && newValue !== void 0 && newValue.length > 0) {
                                if (newValue[0] !== '+') {
                                    newValue = '+' + newValue;
                                }
                                ctrl.$modelValue = newValue;
                            }
                            element.intlTelInput(options);
                            if (!(options.skipUtilScriptDownload || attrs.skipUtilScriptDownload !== void 0 || options.utilsScript)) {
                                //element.intlTelInput('loadUtils', '/bower_components/intl-tel-input/build/utils.js');
                            }
                            return watchOnce();
                        });
                    });
                    scope.$watch('country', function (newValue) {
                        if (newValue !== null && newValue !== void 0 && newValue !== '') {
                            return element.intlTelInput("selectCountry", newValue);
                        }
                    });
                    ctrl.$formatters.push(function (value) {
                        if (!value) {
                            return value;
                        }
                        setTimeout(function () {
                            element.intlTelInput('setNumber', value)
                        }, 0);
                        return value;//.replace(/[^\d]/g, '');
                    });
                    ctrl.$parsers.push(function (value) {
                        value = element.intlTelInput("getNumber");
                        return value;
                    });
                    ctrl.$validators.internationalPhoneNumber = function (value) {
                        if (!value) return true;
                        var selectedCountry;
                        selectedCountry = element.intlTelInput('getSelectedCountryData');
                        if (!value || (selectedCountry && selectedCountry.dialCode === value)) {
                            return true;
                        }
                        return element.intlTelInput("isValidNumber");
                    };
                    //ctrl.$render = function () {
                    //    return read();
                    //}
                    element.on('blur keyup change', function (event) {
                        return scope.$apply(read);
                    });
                    return element.on('$destroy', function () {
                        element.intlTelInput('destroy');
                        return element.off('blur keyup change');
                    });
                }
            };
        }
    ]);
}(angular));