(function () {
    var module = angular.module('cab9.driverpayments');

    module.controller('DriverPaymentsTableController', driverPaymentsTableController);

    driverPaymentsTableController.$inject = ['$scope', '$modal', 'Model', '$state', '$timeout', '$http', '$config', '$UI', 'CSV', 'Localisation'];

    function driverPaymentsTableController($scope, $modal, Model, $state, $timeout, $http, $config, $UI, CSV, Localisation) {
        $scope.payments = [];
        $scope.searchTerm = {
            $: ""
        };
        $scope.toggleSearch = toggleSearch;
        $scope.filterPayments = filterPayments;
        $scope.showSearch = false;
        $scope.loading = true;

        $scope.openPaymentModal = openPaymentModal;


        function toggleSearch() {
            $scope.showSearch = !$scope.showSearch;
            if (!$scope.showSearch) {
                $scope.searchTerm.$ = '';
            } else {
                setTimeout(function () {
                    $('#searchTerm').focus()
                }, 500);
            }
        }
        var debounce = null;
        $scope.paging = {
            currentPage: 1,
            resultsPerPage: 20,
            totalResults: null,
            maxPages: null
        };
        $scope.setPage = setPage;

        $scope.showFilterModal = showFilterModal;
        $scope.filter = {
            date: {
                from: moment().subtract(7, 'days').startOf("isoweek"),
                to: moment().subtract(7, 'days').endOf("isoweek"),
                span: 'week',
                selectedPeriod: "Last Week"
            },
            Amount: {
                from: null,
                to: null,
            },
            DriverId: null,
            Status: {
                Draft: true,
                Approved: true,
                Settled: false
            }
        };

        function showFilterModal() {
            $modal.open({
                templateUrl: '/webapp/management/driver-payments/modal/filter.modal.partial.html',
                controller: ['$scope', 'rFilter', '$modalInstance', 'rDrivers', function ($scope, rFilter, $modalInstance, rDrivers) {
                    $scope.filterOptions = angular.copy(rFilter);
                    $scope.drivers = rDrivers;
                    setTimeout(function () {
                        $('#daterangepicker_bookings').daterangepicker({
                            locale: {
                                format: 'DD/MM/YYYY'
                            },
                            "autoApply": true,
                            "startDate": moment($scope.filterOptions.date.from).startOf('day'),
                            "endDate": moment($scope.filterOptions.date.to).endOf("day"),
                            "opens": "right",
                            "parentEl": "#time-controls",
                            ranges: {
                                'This Week': [moment().startOf('isoweek'), moment().endOf('isoweek')],
                                'Last Week': [moment().subtract(7, 'days').startOf('isoweek'), moment().subtract(7, 'days').endOf('isoweek')],
                                'This Month': [moment().startOf('month'), moment().endOf('month')]
                            },
                            "alwaysShowCalendars": true,
                        });

                        $('#daterangepicker_bookings').on('apply.daterangepicker', function (ev, picker) {
                            $scope.filterOptions.date.selectedPeriod = picker.chosenLabel;
                            $scope.filterOptions.date.from = picker.startDate.toISOString();
                            $scope.filterOptions.date.to = picker.endDate.toISOString();
                            if ($scope.filterOptions.date.selectedPeriod == "Custom Range") {
                                $scope.filterOptions.date.selectedPeriod += " (" + moment($scope.filterOptions.date.from).format('DD/MM/YYYY') + " - " + moment($scope.filterOptions.date.to).format('DD/MM/YYYY') + ")";
                            }
                            $scope.$apply();
                        });
                    }, 100)

                    $scope.datePickers = {
                        from: false,
                        to: false
                    }

                    $scope.openDatePicker = function ($event, type) {
                        $scope.datePickers[type] = !$scope.datePickers[type];
                        event.preventDefault();
                        event.stopPropagation();
                    }

                    $scope.confirmFilters = confirmFilters;

                    function confirmFilters() {
                        $modalInstance.close($scope.filterOptions);
                    }
                }],
                resolve: {
                    rFilter: function () {
                        return $scope.filter;
                    },
                    rDrivers: function () {
                        return Model.Driver
                            .query()
                            .select('Id,Firstname,Surname,Callsign,DriverType/Name')
                            .include('DriverType')
                            .parseAs(function (data) {
                                this.Id = data.Id;
                                this.Name = "(" + data.Callsign + ") " + data.Firstname + ' ' + data.Surname;
                                this.Description = data.DriverType.Name;
                            })
                            .execute();
                    }
                },
                size: 'lg'
            }).result.then(function (result) {
                $scope.filter = result;
            });
        }

        function filterPayments() {
            setPage(1);
        }

        function setPage(page) {
            $scope.paging.currentPage = page;
            $scope.loading = true;
            var from = new moment($scope.filter.date.from);
            var to = new moment($scope.filter.date.to).add(2, 'hours');
            var invoiceQuery = Model.DriverPayment.query()
                .include('Driver,Bill,Invoice')
                .skip($scope.paging.resultsPerPage * ($scope.paging.currentPage - 1))
                .top($scope.paging.resultsPerPage)
                .orderBy('PaymentTo');

            if ($scope.searchTerm.$.length > 0) {
                invoiceQuery.where("substringof('" + $scope.searchTerm.$ + "', Driver/Surname) or substringof('" + $scope.searchTerm.$ + "', Driver/Firstname) or substringof('" + $scope.searchTerm.$ + "', Driver/Callsign)");
            } else {
                invoiceQuery
                    .filter('PaymentTo', 'ge', "datetimeoffset'" + from.format() + "'")
                    .filter('PaymentTo', 'le', "datetimeoffset'" + to.format() + "'");
                if ($scope.filter.DriverId)
                    invoiceQuery.filter('DriverId', '==', "guid'" + $scope.filter.DriverId + "'");

                if ($scope.filter.Amount.from) {
                    invoiceQuery.filter('TotalAmount', 'ge', $scope.filter.Amount.from)
                }
                if ($scope.filter.Amount.to) {
                    invoiceQuery.filter('TotalAmount', 'le', $scope.filter.Amount.to)
                }
                var statusFilter = '';
                if ($scope.filter.Status) {
                    var keys = Object.keys($scope.filter.Status)
                    for (var i = 0; i < keys.length; i++) {
                        if ($scope.filter.Status[keys[i]]) {
                            if (statusFilter.length > 0) {
                                statusFilter += ' or ';
                            } else {
                                statusFilter += '(';
                            }
                            statusFilter += "Status eq '" + keys[i] + "'";
                        }
                    }
                }
                if (statusFilter.length > 0) {
                    statusFilter += ')';
                } else {
                    statusFilter = "1 eq 1";
                }
                invoiceQuery.where(statusFilter);
            }
            
            invoiceQuery.execute()
                    .then(function (results) {
                        $scope.payments = results;
                        $scope.loading = false;
                    }, function (error) {
                        $scope.loading = false;
                        swal("Error", "Please try again or contact admin", "error");
                    });
        }

        $scope.$watchGroup(['filter.date.from.valueOf()', 'filter.date.to.valueOf()', 'searchTerm.$', 'filter.DriverId', 'filter.Status.Unsent', 'filter.Status.Unpaid', 'filter.Status.Paid', 'filter.Amount.from', 'filter.Amount.to'], function (newValue, oldValue) {
            $scope.loading = true;
            var from = new moment($scope.filter.date.from);
            var to = new moment($scope.filter.date.to).add(2, 'hours');
            var invoiceQuery = Model.DriverPayment.query()
                .include('Driver,Bill,Invoice')
                .select('Id')
                .parseAs(function (data) {
                    this.Id = data.Id;
                });

            if ($scope.searchTerm.$.length > 0) {
                invoiceQuery.where("substringof('" + $scope.searchTerm.$ + "', Driver/Surname) or substringof('" + $scope.searchTerm.$ + "', Driver/Firstname) or substringof('" + $scope.searchTerm.$ + "', Driver/Callsign)");
            } else {
                invoiceQuery
                    .filter('PaymentTo', 'ge', "datetimeoffset'" + from.format() + "'")
                    .filter('PaymentTo', 'le', "datetimeoffset'" + to.format() + "'");
                if ($scope.filter.DriverId)
                    invoiceQuery.filter('DriverId', '==', "guid'" + $scope.filter.DriverId + "'");

                if ($scope.filter.Amount.from) {
                    invoiceQuery.filter('TotalAmount', 'ge', $scope.filter.Amount.from)
                }
                if ($scope.filter.Amount.to) {
                    invoiceQuery.filter('TotalAmount', 'le', $scope.filter.Amount.to)
                }

                var statusFilter = '';
                if ($scope.filter.Status) {
                    var keys = Object.keys($scope.filter.Status)
                    for (var i = 0; i < keys.length; i++) {
                        if ($scope.filter.Status[keys[i]]) {
                            if (statusFilter.length > 0) {
                                statusFilter += ' or ';
                            } else {
                                statusFilter += '(';
                            }
                            statusFilter += "Status eq '" + keys[i] + "'";
                        }
                    }
                }
                if (statusFilter.length > 0) {
                    statusFilter += ')';
                } else {
                    statusFilter = "1 eq 1";
                }
                invoiceQuery.where(statusFilter)
            }

            
            invoiceQuery.execute()
                    .then(function (data) {
                        $scope.paging.totalResults = data.length;
                        $scope.paging.maxPages = Math.ceil($scope.paging.totalResults / $scope.paging.resultsPerPage);
                        setPage(1);
                    });

        })


        $scope.exportSummary = function () {
            $modal.open({
                templateUrl: '/webapp/management/driver-payments/modal/export-summary.partial.html',
                controller: ['$scope', '$modalInstance', 'rDrivers', function ($scope, $modalInstance, rDrivers) {
                    $scope.drivers = rDrivers
                    $scope.options = {
                        driverId: null,
                        period: {
                            from: new moment().subtract(7, 'days').startOf('isoweek'),
                            to: new moment().subtract(7, 'days').endOf('isoweek'),
                            summary: 'Last Week',
                        }
                    }

                    $scope.proceed = function () {
                        $modalInstance.close($scope.options);
                    }

                    setTimeout(function () {
                        $('#daterangepicker_bookings').daterangepicker({
                            locale: {
                                format: 'DD/MM/YYYY'
                            },
                            "autoApply": true,
                            "startDate": $scope.options.period.from,
                            "endDate": $scope.options.period.to,
                            "opens": "bottom",
                            //"parentEl": "#time-controls",
                            ranges: {
                                'Today': [moment().startOf("day"), moment().endOf("day")],
                                'This Week': [moment().startOf('isoweek'), moment().endOf('isoweek')],
                                'Last Week': [moment().subtract(7, 'days').startOf('isoweek'), moment().subtract(7, 'days').endOf('isoweek')],
                                'This Month': [moment().startOf('month'), moment().endOf('month')]
                            },
                            "alwaysShowCalendars": true,
                        });

                        $('#daterangepicker_bookings').on('apply.daterangepicker', function (ev, picker) {
                            $scope.options.period.summary = picker.chosenLabel;
                            $scope.options.period.from = new moment(picker.startDate);
                            $scope.options.period.to = new moment(picker.endDate);
                            if ($scope.options.period.summary == "Custom Range") {
                                $scope.options.period.summary = $scope.options.period.from.format("DD/MM/YYYY") + "-" + $scope.options.period.to.format("DD/MM/YYYY");
                            }
                            $scope.$apply();
                        });
                    }, 100)
                }],
                keyboard: false,
                backdrop: 'static',
                resolve: {
                    rDrivers: ['Model', function (Model) {
                        return Model.Driver
                            .query()
                            .select('Id,Firstname,Surname,Callsign,ImageUrl')
                            .parseAs(function (item) {
                                this.Id = item.Id;
                                this.Name = item.Firstname + ' ' + item.Surname + ' (' + item.Callsign + ')';
                                this.ImageUrl = formatUrl(item.ImageUrl, item.Callsign);
                            })
                            .execute();
                    }],
                }
            }).result.then(function (options) {
                var query = "" + "from=" + _formatDate(options.period.from.startOf('day')).utc().format('YYYY-MM-DDTHH:mm') + 'Z' + "&to=" + _formatDate(options.period.to.endOf('day')).add(1, 'hour').utc().format('YYYY-MM-DDTHH:mm') + 'Z' + "&driverId=" + options.driverId;

                $http.get($config.API_ENDPOINT + 'api/driverpayments/Summary?' + query).then(function (response) {
                    CSV.download(response.data, "PaymentSummary.csv");
                }, function (err) {
                    swal({
                        title: "Some Error Occured.",
                        text: "Some error has occured.",
                        type: "error",
                        confirmButtonColor: $UI.COLOURS.brandSecondary
                    });
                });
            });
        }

        function openPaymentModal() {
            var modalInstance = $modal.open({
                templateUrl: '/webapp/management/driver-payments/modal/new-payment/partial.html',
                controller: 'NewPaymentInitController',
                keyboard: false,
                backdrop: 'static',
                size: 'lg',
                resolve: {
                    rDrivers: ['Model', function (Model) {
                        return Model.Driver
                            .query()
                            .select('Id,Firstname,Surname,Callsign,ImageUrl,DriverTypeId,DriverType/Name')
                            .include('DriverType/DefaultDriverPaymentModel')
                            .include('DefaultDriverPaymentModel')
                            .parseAs(function (item) {
                                this.Id = item.Id;
                                this.Name = item.Firstname + ' ' + item.Surname + ' (' + item.Callsign + ')';
                                this.Description = item.DriverType.Name;
                                this.DriverTypeId = item.DriverTypeId;
                                this.ImageUrl = formatUrl(item.ImageUrl, item.Callsign);
                            })
                            .execute();
                    }],
                }
            })

            modalInstance.result.then(function (data) {}, function () {});
        }

        $scope.$watch('selected', function (newvalue, oldvalue) {
            if (newvalue && oldvalue) {
                if (debounce) {
                    $timeout.cancel(debounce);
                }
                debounce = $timeout(function () {
                    Model.DriverPayment.query()
                        .include('Driver')
                        .include('PaymentModel')
                        .include('Invoice')
                        .include('Bill')
                        .filter('CreationTime', 'ge', "datetimeoffset'" + $scope.selected.from.format() + "'")
                        .filter('CreationTime', 'le', "datetimeoffset'" + $scope.selected.to.format() + "'")
                        .execute().then(function (data) {
                            $scope.payments = data;
                            debounce = null;
                        })
                }, 250);
            }
        }, true)

        $scope.viewItem = function ($row) {
            $state.go('root.driverpayments.viewer.summary', {
                Id: $row.Id
            });
        }

        function _formatDate(date) {
            var bdt = moment.tz(date, Localisation.timeZone().getTimeZone());
            return bdt;
        }
    }
}())