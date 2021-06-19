(function (angular) {
    var module = angular.module('framework.filters.utility', []);

    module.filter('RemoveSpaces', removeSpaces);
    module.filter('Truncate', truncate);
    module.filter('Mtruncate', mtruncate);
    module.filter('AbbrValue', abbrValue);
    module.filter('Countdown', countdown);
    module.filter('Convert', currencyConverter);
    module.filter('Format', currencyFormatter);
    module.filter('TZConvert', timezoneConverter);
    module.filter('companyDate', companyDate);
    module.filter('formatImage', formatImage);
    module.filter('time', time);
    module.filter('minsToHr', minsToHr);

    function minsToHr() {
        return function (time) {
            if (time) {
                var hours = (time / 60);
                var rhours = Math.floor(hours);
                var minutes = (hours - rhours) * 60;
                var rminutes = Math.round(minutes);

                return rhours + 'h:' + rminutes + 'm';
            } else {
                return "00:00";
            }

        }
    }

    function time() {
        return function (time) {
            return time.substring(0, 5);
        }
    }

    function removeSpaces() {
        return function (text) {
            return text.replace(/\s/g, '');
        }
    }

    function truncate() {
        return function (text, length, end) {
            if (isNaN(length))
                length = 10;
            if (end === undefined)
                end = "...";
            if (text && (text.length <= length || text.length - end.length <= length)) {
                return text;
            } else {
                return String(text).substring(0, length - end.length) + end;
            }
        }
    }

    function mtruncate() {
        return function (fullStr, strLen) {
            if (fullStr.length <= strLen) return fullStr;

            separator = '...';

            var sepLen = separator.length,
                charsToShow = strLen - sepLen,
                frontChars = Math.ceil(charsToShow / 2),
                backChars = Math.floor(charsToShow / 2);

            return fullStr.substr(0, frontChars) +
                separator +
                fullStr.substr(fullStr.length - backChars);
        };
    }

    function abbrValue() {
        return function (val) {

            return Math.abs(Number(val)) >= 1.0e+9

                ?
                Math.round(Math.abs((Number(val)) / 1.0e+9) * 10) / 10 + "b"
                // Six Zeroes for Millions 
                :
                Math.abs(Number(val)) >= 1.0e+6

                ?
                Math.round(Math.abs((Number(val)) / 1.0e+6) * 10) / 10 + "m"
                // Three Zeroes for Thousands
                :
                Math.abs(Number(val)) >= 1.0e+3

                ?
                Math.round(Math.abs((Number(val)) / 1.0e+3) * 10) / 10 + "k"

                :
                Math.abs(Number(val));
        }
    }

    function countdown() {
        return function (input) {
            var substitute = function (stringOrFunction, number, strings) {
                    var string = $.isFunction(stringOrFunction) ? stringOrFunction(number, dateDifference) : stringOrFunction;
                    var value = (strings.numbers && strings.numbers[number]) || number;
                    return string.replace(/%d/i, value);
                },
                nowTime = (new Date()).getTime(),
                date = (new Date(input)).getTime(),
                allowFuture = true,
                strings = {
                    prefixAgo: null,
                    prefixFromNow: null,
                    suffixAgo: "ago",
                    suffixFromNow: "", //"from now"
                    seconds: "few seconds",
                    minute: "a minute",
                    minutes: "%d minutes",
                    hour: "an hour",
                    hours: "%d hours",
                    day: "a day",
                    days: "%d days",
                    month: "a month",
                    months: "%d months",
                    year: "a year",
                    years: "%d years"
                },
                dateDifference = nowTime - date,
                words,
                seconds = Math.abs(dateDifference) / 1000,
                minutes = seconds / 60,
                hours = minutes / 60,
                days = hours / 24,
                years = days / 365,
                separator = strings.wordSeparator === undefined ? " " : strings.wordSeparator,
                prefix = strings.prefixAgo,
                suffix = strings.suffixAgo;

            if (allowFuture) {
                if (dateDifference < 0) {
                    prefix = strings.prefixFromNow;
                    suffix = strings.suffixFromNow;
                }
            }

            words = seconds < 45 && substitute(strings.seconds, Math.round(seconds), strings) ||
                seconds < 90 && substitute(strings.minute, 1, strings) ||
                minutes < 45 && substitute(strings.minutes, Math.round(minutes), strings) ||
                minutes < 90 && substitute(strings.hour, 1, strings) ||
                hours < 24 && substitute(strings.hours, Math.round(hours), strings) ||
                hours < 42 && substitute(strings.day, 1, strings) ||
                days < 30 && substitute(strings.days, Math.round(days), strings) ||
                days < 45 && substitute(strings.month, 1, strings) ||
                days < 365 && substitute(strings.months, Math.round(days / 30), strings) ||
                years < 1.5 && substitute(strings.year, 1, strings) ||
                substitute(strings.years, Math.round(years), strings);

            return $.trim([prefix, words, suffix].join(separator));
        }
    }

    currencyConverter.$inject = ['Localisation'];

    function currencyConverter(Localisation) {
        return function (value, toCurrencyId, fromCurrencyId) {
            if (value == null) return null;
            if (value == 0) return 0;
            return Localisation.currency().convert(value, toCurrencyId, fromCurrencyId);
        }
    }

    currencyFormatter.$inject = ['Localisation', '$filter'];

    function currencyFormatter(Localisation, $filter) {
        return function (value, currencyId) {
            var currencyObj = null;
            if (currencyId)
                currencyObj = Localisation.currency().getById(currencyId);
            else
                currencyObj = Localisation.currency().getCurrent();
            if (currencyObj) {
                if (!value) {
                    return currencyObj.Prepend + "0.00";
                }
                return currencyObj.Prepend + $filter('number')(value, 2);
            } else
                return $filter('currency')(value);
        }
    }

    timezoneConverter.$inject = ['Localisation'];

    function timezoneConverter(Localisation) {
        return function (date) {
            var tz = Localisation.timeZone().timeZoneDateTime(date);
            return tz;
        }
    }

    companyDate.$inject = ['Localisation'];

    function companyDate(Localisation) {
        return function (date, format, zone) {
            var tz = new moment(Localisation.timeZone().timeZoneDateTime(date));
            if (zone) {
                tz = tz.tz(zone);
            }
            return tz.format(format);
        }
    }

    function formatImage() {
        return function (url, text) {
            if (url) {
                if (url.slice(0, 4) === "http") {
                    return url;
                } else if (url.slice(0, 4) === "api/") {
                    return window.endpoint + url;
                } else {
                    return window.resourceEndpoint + url;
                }
            } else {
                return window.endpoint + "api/imagegen?text=" + text;
            }
        }
    }
})(angular);