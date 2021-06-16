(function (window, angular) {
    var app = angular.module("framework.services.currency", ['tmh.dynamicLocale']);

    app.config(configFunc);
    app.provider('Localisation', LocalisationProvider);
    app.run(runFunc);

    configFunc.$inject = ['tmhDynamicLocaleProvider'];

    function configFunc(tmhDynamicLocaleProvider) {
        tmhDynamicLocaleProvider.localeLocationPattern('https://code.angularjs.org/1.4.6/i18n/angular-locale_{{locale}}.js');
    }

    function LocalisationProvider() {
        var available = [];
        var current = null;
        var base = null;
        var timezone = null;

        var provider = {
            $get: [
                '$http',
                '$config',
                '$q',
                '$locale',
                'GoogleDirections',
                getService
            ]
        };

        return provider;

        function getService($http, $config, $q, $locale, GoogleDirections) {
            var service = {
                currency: currency,
                timeZone: timeZones,
                useMetric: useMetric
            };

            return service;

            function currency() {
                var curObj = {
                    currencies: currencies,
                    getById: getById,
                    setCurrent: setCurrent,
                    getCurrent: getCurrent,
                    convert: convert
                }

                return curObj;

                function currencies() {
                    var deferred = $q.defer();
                    $http
                        .get($config.API_ENDPOINT + '/api/Currencies')
                        .success(function (res) {
                            available = res;
                            deferred.resolve(available);
                        })
                        .error(function (err) {
                            deferred.reject(err);
                        });
                    return deferred.promise;
                }

                function getById(Id) {
                    var currencyObj = available.filter(function (c) {
                        return c.Id == Id;
                    })[0];
                    return currencyObj;
                }

                function setCurrent(currencyId) {
                    var currencyObj = available.filter(function (c) {
                        return c.Id == currencyId;
                    })[0];

                    if (!current && !base) 
                        base = currencyObj;
                    current = currencyObj;
                }

                function getCurrent() {
                    return current;
                }

                function convert(amount, toCurrencyId, fromCurrencyId) {
                    var from = base;
                    var rate = 1;
                    var to = current;
                    if (toCurrencyId) {
                        var toCurr = available.filter(function (c) {
                            return c.Id == toCurrencyId;
                        })[0];
                        to = toCurr;
                    }
                    if (fromCurrencyId) {
                        from = available.filter(function (c) {
                            return c.Id == fromCurrencyId;
                        })[0];
                    }
                    rate = to.CurrentRate / from.CurrentRate;
                    return Math.round(amount * rate * 100) / 100; // converting to 2 decimal places
                }
            }

            function timeZones() {
                var tzObj = {
                    timeZoneDateTime: timeZoneDateTime,
                    setTimeZone: setTimeZone,
                    getTimeZone: getTimeZone
                }
                return tzObj;

                function timeZoneDateTime(utcDt) {
                    if (timezone) {
                        var val = moment
                            .tz(utcDt, timezone)
                            .format();
                        return val;
                    } else 
                        return new moment(utcDt).subtract(new Date().getTimezoneOffset(), 'minutes').format();
                    }
                
                function setTimeZone(tz) {
                    timezone = tz;
                }

                function getTimeZone() {
                    return timezone;
                }
            }

            function useMetric(metric) {
                var settings = null;
                if (metric == 1) 
                    settings = {
                        unitSystem: google.maps.UnitSystem.METRIC
                    };
                else 
                    settings = {
                        unitSystem: google.maps.UnitSystem.IMPERIAL
                    };
                GoogleDirections.setDefaults(settings);
            }
        }
    };

    runFunc.$inject = ['$locale', '$rootScope']

    function runFunc($locale, $rootScope) {
        $rootScope.DATETIME_FORMAT = 'dd/MM/yyyy';

        $rootScope.$on('$localeChangeSuccess', function () {
            $rootScope.DATETIME_FORMAT = $locale.DATETIME_FORMATS.shortDate;
        });
    }
})(window, angular);