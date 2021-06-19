(function (window, angular) {
    var app = angular.module("cab9.export");

    app.config(configFunc);
    app.controller('BillReceiptController', invoiceReceiptController);

    app.filter('Format', currencyFormatter);
    app.filter('TZConvert', timezoneConverter);

    configFunc.$inject = ['tmhDynamicLocaleProvider'];
    function configFunc(tmhDynamicLocaleProvider) {
        tmhDynamicLocaleProvider.localeLocationPattern('https://code.angularjs.org/1.4.6/i18n/angular-locale_{{locale}}.js');
    }

    invoiceReceiptController.$inject = ['$scope', '$http', '$location', '$config', 'tmhDynamicLocale'];
    function invoiceReceiptController($scope, $http, $location, $config, tmhDynamicLocale) {
        //$scope.token = $location.search().token;
        $scope.token = "MoYKaqVXvvcCFfsL9r170SEqXzAIQJLeuow5KCmjgJDeT8IJ5-rWc9dcwiJv2AjsZ6ds3EjkAEMP2O-fjQqwr9KQ19T717eEJK7BsB6kX4tEj87OMf48PSfy9w3aaLebAkX-ZWYrsQSBvTdiwrA7AbCZYF1YPH8mGBgeX6cO2idy6J_qPgWKVVWNtssE3Twke5j0X_swyqhshgTYnZk_fXEyZVSlboNMYz9uIgVsd6L7YwZ1DWpxC4homgWg32zxggpDRaCzjqJdN-A1LzW1JwX2msRJNdCLdMEn0kX0zTxcJrIRETZPesmzJmabO9skV2OxIwK4A--_FSfWL8Lej3v756G4BUYtnbOMOktTJkg4P1-tB17zfDcOP8gLjHtEzNlwl5UKVKQmTqz7TtE_bxPVOwptRtMCJAh-6bU-6SUZQkXz--E0E2zjoCxORhxjldfWW2mL8A2RFEMepgwsuu0_KbXHuje8ngLrwyXAV2sBqKqllhHjJj6IugU-ZB7RO2KCabvSJ60qjBDtMnMNyGA_ILcj-Cglky8nNuJN2usR95BGZKUsFsSdLDk8oNCM6Il6wzPjjFhMRRQL1S-DNgji7TGInoDy5JW6LSqwUhQ";
        //$scope.paymentId = $location.search().paymentId;
        $scope.paymentId = "05db083f-d7a0-e511-80dc-d43d7e1d5603";
        $scope.API_ENDPOINT = $config.API_ENDPOINT;
        $scope.currencyIcon = '£';
        $scope.timezone = null;
        $scope.BillBookings = [];

        $http({
            method: 'GET',
            url: $config.API_ENDPOINT + "api/companies",
            headers: {
                Authorization: "Bearer " + $scope.token
            }
        }).success(function (data) {
            $scope.company = data[0];

            //set localisation values
            if (data[0].DefaultCurrencyId) {
                $http({
                    method: 'GET',
                    url: $config.API_ENDPOINT + "api/currencies?$filter=Id eq guid'" + data[0].DefaultCurrencyId + "'",
                    headers: {
                        Authorization: "Bearer " + $scope.token
                    }
                }).success(function (res) {
                    if (res[0])
                        $scope.currrencyIcon = res[0].Prepend;
                });
            }
            if (data[0].DefaultLocale)
                tmhDynamicLocale.set(data[0].DefaultLocale);
            else
                tmhDynamicLocale.set($config.DEFAULT_LOCALE);

            if (data[0].DefaultTimezone) {
                moment.tz.setDefault(data[0].DefaultTimezone);
                $scope.timezone = data[0].DefaultTimezone;
            }
        });

        $http({
            method: 'GET',
            url: $config.API_ENDPOINT + "api/DriverPayments?$expand=Driver,Bill/BillPayments,PaymentModel,Bookings/LeadPassenger,Bookings/BookingStops,Bookings/Vehicle&$filter=Id eq guid'" + $scope.paymentId + "'",
            headers: {
                Authorization: "Bearer " + $scope.token
            }
        }).success(function (data) {
            $scope.payment = data[0];
            if ($scope.payment.Bookings)
                $scope.BillBookings = $scope.payment.Bookings.filter(function (b) { return b.PaymentMethod != 'Cash' });                
        });

        $scope.getAddressSummary = getAddressSummary;

        function getAddressSummary(address) {
            if (address) {
                var add = '';
                if (address.Address1.length > 1) {
                    add += address.Address1;
                }
                if (address.TownCity) {
                    if (add.length > 0) {
                        add += ', ';
                    }
                    add += address.TownCity;
                } else if (address.Area) {
                    if (add.length > 0) {
                        add += ', ';
                    }
                    add += address.Area;
                }
                if (address.County && add.length == 0) {
                    add += address.County;
                }
                if (address.Postcode) {
                    if (add.length > 0) {
                        add += ', ';
                    }
                    add += address.Postcode;
                }
                return add;
            }
        }

        $scope.getImageUrl = getImageUrl;

        function getImageUrl(url, name) {
            if (url) {
                if (url.slice(0, 4) == 'http') {
                    return url;
                } else {
                    return $config.API_ENDPOINT + url;
                }
            } else {
                if (name) {
                    return $config.API_ENDPOINT + 'api/imagegen?text=' + name[0];
                }
            }
        }

        $scope.getFromSummary = getFromSummary;

        function getFromSummary(stops) {
            if (stops && stops.length) {
                var model = stops[0];
                var add = '';
                if (model.Address1.length > 1) {
                    add += model.Address1;
                }
                if (model.TownCity) {
                    if (add.length > 0) {
                        add += ', ';
                    }
                    add += model.TownCity;
                } else if (model.Area) {
                    if (add.length > 0) {
                        add += ', ';
                    }
                    add += model.Area;
                }
                if (model.County && add.length == 0) {
                    add += model.County;
                }
                if (model.Postcode) {
                    if (add.length > 0) {
                        add += ', ';
                    }
                    add += model.Postcode;
                }
                return add;
            }
        }

        $scope.getToSummary = getToSummary;

        function getToSummary(stops) {
            if (stops && stops.length) {
                var model = stops[stops.length - 1];
                var add = '';
                if (model.Address1.length > 1) {
                    add += model.Address1;
                }
                if (model.TownCity) {
                    if (add.length > 0) {
                        add += ', ';
                    }
                    add += model.TownCity;
                } else if (model.Area) {
                    if (add.length > 0) {
                        add += ', ';
                    }
                    add += model.Area;
                }
                if (model.County && add.length == 0) {
                    add += model.County;
                }
                if (model.Postcode) {
                    if (add.length > 0) {
                        add += ', ';
                    }
                    add += model.Postcode;
                }
                return add;
            } else {
                return 'As Directed';
            }
        }

        $scope.calculatePaidAmount = calculatePaidAmount;

        function calculatePaidAmount(bill) {
            var res = 0.0;
            if (bill && bill.BillPayments) {
                angular.forEach(bill.BillPayments, function (p) {
                    res = res + parseFloat(p.Amount);
                });
            }
            return res;
        }

        $scope.calculateBookingsValue = calculateBookingsValue;
        
        function calculateBookingsValue() {
            var res = 0.0;
            angular.forEach($scope.BillBookings, function (b) {
                res = res + b.ActualCost;
            });
            return res;
        }
    }

    currencyFormatter.$inject = ['$filter'];
    function currencyFormatter($filter) {
        return function (value, currency) {
            if (currency) {
                if (!value) { return currency + "0.00" };
                return currency + $filter('number')(value, 2);
            }
            return value;
        }
    }

    function timezoneConverter() {
        return function (utcDt, timezone) {
            if (timezone) {
                var val = moment(new Date(utcDt)).subtract(new Date().getTimezoneOffset(), 'minutes').tz(timezone).format();
                return val.substring(0, 16);
            }
            else
                return new moment(utcDt).subtract(new Date().getTimezoneOffset(), 'minutes').format().substring(0, 16);
        }
    }

})(window, angular);
