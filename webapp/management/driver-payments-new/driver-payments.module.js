(function (window, angular) {
    var module = angular.module('cab9.driverpayments', [])

    module.config(moduleConfig);
    module.run(moduleRun);
    module.controller('DriverPaymentsSummaryController', DriverPaymentsSummaryController);

    moduleConfig.$inject = ['$stateProvider', 'MenuServiceProvider', 'ModelProvider', '$permissions'];

    function moduleConfig($stateProvider, MenuServiceProvider, ModelProvider, $permissions) {
        if (!$permissions.test('driverpayments')) return;

        $stateProvider.state('root.driverpayments', {
            url: '/driverpayments',
            permission: 'Driver Payments',
            views: {
                'content-wrapper@root': {
                    templateUrl: '/webapp/management/driver-payments-new/driver-payments.partial.html',
                    controller: 'DriverPaymentsSummaryController'
                }
            },
            resolve: {}
        });

        if ($permissions.test('driverpayments.viewer')) {
            $stateProvider.state('root.driverpayments.viewer', {
                url: '/{Id:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}}',
                permission: 'View Payment',
                views: {
                    'content-wrapper@root': {
                        templateUrl: '/webapp/management/driver-payments/item/driver-payments-viewer.partial.html',
                        controller: 'DriverPaymentsItemController'
                    }
                },
                resolve: {
                    rDPayment: ['Model', '$stateParams', function (Model, $stateParams) {
                        return Model.DriverPayment
                            .query()
                            .include('Driver', 'PaymentModel', 'Invoice/Payments', 'Bill/BillPayments')
                            .where('Id', '==', "guid'" + $stateParams.Id + "'")
                            .trackingEnabled()
                            .execute();
                    }],
                    rTaxes: ['Model', function (Model) {
                        return Model.Tax.query().execute();
                    }],
                    rBookings: ['Model', '$stateParams', 'rDPayment', function (Model, $stateParams, rDPayment) {
                        return Model.Booking
                            .query()
                            .include('LeadPassenger, BookingStops, VehicleType, Client')
                            .where('DriverPaymentId', '==', "guid'" + $stateParams.Id + "'")
                            .execute().then(function (bookings) {
                                rDPayment[0].Bookings = bookings;
                            });
                    }],
                    rAdjustments: ['Model', '$stateParams', function (Model, $stateParams) {
                        return Model.DriverPaymentAdjustment
                            .query()
                            .where('DriverPaymentId', '==', "guid'" + $stateParams.Id + "'")
                            .include('DriverPaymentModelAdjustment,DriverAdjustment')
                            .trackingEnabled()
                            .execute();
                    }],
                    rDrivers: ['Model', function (Model) {
                        return Model.Driver
                            .query()
                            .select('Id,Firstname,Surname,Callsign,ImageUrl, Address1, Address2, TownCity, Postcode, DriverType/Name')
                            .include('DriverType/DefaultDriverPaymentModel')
                            .include('DefaultDriverPaymentModel')
                            .parseAs(function (item) {
                                this.Id = item.Id;
                                this.Name = item.Firstname + ' ' + item.Surname + ' (' + item.Callsign + ')';
                                this.Description = item.DriverType.Name;
                                this.ImageUrl = formatUrl(item.ImageUrl, item.Callsign);
                                this.Address1 = item.Address1;
                                this.Address2 = item.Address2;
                                this.TownCity = item.TownCity;
                                this.Postcode = item.Postcode;
                            })
                            .execute();
                    }],
                    rTabs: [function () {
                        var tabs = [{
                            heading: 'Summary',
                            allow: true,
                            route: 'root.driverpayments.viewer.summary'
                        }, {
                            heading: 'Pay to Driver',
                            route: 'root.driverpayments.viewer.bill'
                        }, {
                            heading: 'Collect From Driver',
                            route: 'root.driverpayments.viewer.invoice'
                        }, {
                            heading: 'Payments',
                            route: 'root.driverpayments.viewer.payments'
                        }];
                        return tabs.filter(function (t) {
                            return t.allow || $permissions.test(t.route.substring(5));
                        });
                    }]
                }
            });

            $stateProvider.state('root.driverpayments.viewer.summary', {
                url: '/summary',
                templateUrl: '/webapp/management/driver-payments/item/driver-payment-summary.partial.html'
            });

            $stateProvider.state('root.driverpayments.viewer.invoice', {
                url: '/invoice',
                templateUrl: '/webapp/management/driver-payments/item/driver-payment-invoice.partial.html'
            });

            $stateProvider.state('root.driverpayments.viewer.adjustment', {
                url: '/adjustment',
                templateUrl: '/webapp/management/driver-payments/item/adjustments/partial.html',
                controller: 'DriverPaymentsViewAdjustmentsController',
                resolve: {
                    rAdjustments: ['Model', 'rDPayment', function (Model, rDPayment) {
                        return Model.DriverPaymentAdjustment
                            .query()
                            .where('DriverPaymentId', '==', "guid'" + rDPayment[0].Id + "'")
                            .include('DriverPaymentModelAdjustment,DriverAdjustment')
                            .trackingEnabled()
                            .execute();
                    }]
                }
            });

            $stateProvider.state('root.driverpayments.viewer.payments', {
                url: '/payments',
                templateUrl: '/webapp/management/driver-payments/item/driver-payment-payments.partial.html',
                controller: 'DriverPaymentPaymentsController',
                resolve: {
                    'rDInvoicePayments': ['Model', 'rDPayment', function (Model, rDPayment) {
                        if (!rDPayment[0].InvoiceId)
                            return null;
                        return Model.Payment
                            .query()
                            .where('InvoiceId', '==', "guid'" + rDPayment[0].InvoiceId + "'")
                            .trackingEnabled()
                            .execute();
                    }],
                    'rBillPayments': ['Model', 'rDPayment', function (Model, rDPayment) {
                        if (!rDPayment[0].BillId)
                            return null;
                        return Model.BillPayment
                            .query()
                            .where('BillId', '==', "guid'" + rDPayment[0].BillId + "'")
                            .trackingEnabled()
                            .execute();
                    }],
                    'rDriverId': ['rDPayment', function (rDPayment) {
                        return rDPayment[0].DriverId
                    }]
                }
            });

            $stateProvider.state('root.driverpayments.viewer.bill', {
                url: '/bill',
                templateUrl: '/webapp/management/driver-payments/item/driver-payment-bill.partial.html'
            });
        }
        if ($permissions.test('driverpayments', 'W')) {
            $stateProvider.state('root.driverpayments.create', {
                url: '/create',
                views: {
                    'content-wrapper@root': {
                        templateUrl: '/webapp/management/driver-payments/item/driver-payments-viewer.partial.html',
                        controller: 'DriverPaymentsCreateController'
                    }
                },
                params: {
                    data: null
                },
                resolve: {
                    rTabs: [function () {
                        var tabs = [{
                            heading: 'Summary',
                            route: 'root.driverpayments.create.summary'
                        }, {
                            heading: 'Receivables',
                            route: 'root.driverpayments.create.invoice'
                        }, {
                            heading: 'Payables',
                            route: 'root.driverpayments.create.bill'
                        }, {
                            heading: 'Adjustments',
                            route: 'root.driverpayments.create.adjustment'
                        }];
                        return tabs;
                    }],
                    rDrivers: ['Model', function (Model) {
                        return Model.Driver
                            .query()
                            .select('Id,Firstname,Surname,Callsign,ImageUrl, Address1, Address2, TownCity, Postcode, DriverType, DefaultDriverPaymentModel')
                            .include('DriverType/DefaultDriverPaymentModel')
                            .include('DefaultDriverPaymentModel')
                            .parseAs(function (item) {
                                this.Id = item.Id;
                                this.Name = item.Firstname + ' ' + item.Surname + ' (' + item.Callsign + ')';
                                this.Description = item.DriverType.Name;
                                this.ImageUrl = formatUrl(item.ImageUrl, item.Callsign);
                                this.Address1 = item.Address1;
                                this.Address2 = item.Address2;
                                this.TownCity = item.TownCity;
                                this.Postcode = item.Postcode;
                                this.DefaultDriverPaymentModel = item.DefaultDriverPaymentModel;
                                this.DriverType = item.DriverType;
                            })
                            .execute();
                    }]
                }
            });

            $stateProvider.state('root.driverpayments.create.summary', {
                url: '/summary',
                templateUrl: '/webapp/management/driver-payments/item/driver-payment-summary.partial.html'
            });

            $stateProvider.state('root.driverpayments.create.invoice', {
                url: '/invoice',
                templateUrl: '/webapp/management/driver-payments/item/driver-payment-invoice.partial.html'
            });

            $stateProvider.state('root.driverpayments.create.bill', {
                url: '/bill',
                templateUrl: '/webapp/management/driver-payments/item/driver-payment-bill.partial.html'
            });

            $stateProvider.state('root.driverpayments.create.adjustment', {
                url: '/adjustment',
                templateUrl: '/webapp/management/driver-payments/item/adjustments/partial.html',
                controller: 'DriverPaymentsCreateAdjustmentsController'
            });
        }



        MenuServiceProvider.registerMenuItem({
            state: 'root.driverpayments',
            icon: 'offline_pin',
            title: 'Driver Payments'
        });

        ModelProvider.registerSchema('DriverPaymentGenOptions', '', {
            From: {
                type: moment
            },
            To: {
                type: moment,
                required: true
            },
            Dispute: {
                type: Boolean,
            }
        });
    }

    moduleRun.$inject = [];

    function moduleRun() {

    }

    DriverPaymentsSummaryController.$inject = ['$scope', '$http', '$config', '$timeout', 'Model', '$state', '$UI', 'CSV', '$filter', '$q', '$modal'];

    function DriverPaymentsSummaryController($scope, $http, $config, $timeout, Model, $state, $UI, CSV, $filter, $q, $modal) {
        var graphData = null;
        var graphDataPromise = null;
        $scope.currentPeriod = {
            from: null,
            to: null,
            year: null,
            week: null,
            stats: {},
            attentionRequired: [],
            payments: [],
            eligabledrivers: [],
            extraPayments: [],
            undergeneration: []
        };

        $scope.selected = {
            all: allSelected,
            toggleAll: toggleAll
        };

        graphDataPromise = $http.get($config.API_ENDPOINT + 'api/DriverPayments/periods', {
            params: {
                max: 52
            }
        });



        function allSelected() {
            var result = true;
            angular.forEach($scope.currentPeriod.payments, function (p) {
                if (p.$selected || !(!hasProcessing(p) && $scope.bulkMode && p.$bulk)) {
                    return;
                } else {
                    result = false;
                }
            });
            return result;
        }

        function toggleAll() {
            if (allSelected()) {
                angular.forEach($scope.currentPeriod.payments, function (p) {
                    p.$selected = false;
                });
            } else {
                angular.forEach($scope.currentPeriod.payments, function (p) {
                    p.$selected = (!hasProcessing(p) && $scope.bulkMode && p.$bulk);
                });
            }
        }

        $scope.tab = {
            current: 'SUMMARY'
        };

        $scope.searchTerm = {};
        $scope.payment = {};
        $scope.estimateSearchTerm = {};
        $scope.bulkMode = null;

        $scope.gotoPeriod = gotoPeriod;
        $scope.forward = forward;
        $scope.back = back;
        $scope.lastWeek = moment().subtract(7, 'days').startOf('isoweek').format();
        $scope.currentWeek = moment().startOf('isoweek').format();
        $scope.today = moment();
        $scope.formatUrl = formatUrl;

        $scope.allDriverSelected = false;
        $scope.selectAllDrivers = selectAllDrivers;
        $scope.getSelectedDriversCount = getSelectedDriversCount;
        $scope.autoGenerate = autoGenerate;
        $scope.preview = preview;
        $scope.approvePayment = approvePayment;
        $scope.reGeneratePayment = reGeneratePayment;
        $scope.autoSettlePayment = autoSettlePayment;
        $scope.cancelPayment = cancelPayment;
        $scope.approvePrice = approvePrice;
        $scope.savePrice = savePrice;
        $scope.hasProcessing = hasProcessing;
        $scope.startBulkMode = startBulkMode;
        $scope.cancelBulkMode = cancelBulkMode;
        $scope.finishBulkMode = finishBulkMode;
        $scope.openBooking = openBooking;
        $scope.generateGraph = generateGraph;
        $scope.toggleCollections = toggleCollections;

        $scope.toggleSearch = toggleSearch;

        $scope.allPayments = [];
        $scope.collectionsOnly = false;

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

        function toggleCollections() {
            if ($scope.collectionsOnly == true) {
                $scope.currentPeriod.payments = $scope.allPayments;
                $scope.collectionsOnly = false;
            } else {
                $scope.currentPeriod.payments = $scope.currentPeriod.payments.filter(function (p) {
                    return p.Balance < 0;
                });
                $scope.collectionsOnly = true;
            }
        }

        $scope.pieOptions = {
            series: {
                pie: {
                    show: true,
                    innerRadius: 0.6,
                    combine: {
                        color: "#999",
                        threshold: 0.03
                    },
                    label: {
                        threshold: 0.03
                    }
                }
            },
            colors: [$UI.COLOURS.brandPrimary, $UI.COLOURS.brandSecondary],
            tooltip: {
                show: true,
                //content: getToolTipData,
                shifts: {
                    x: 25,
                    y: 0
                },
                defaultTheme: false
            },
            grid: {
                // hoverable: true
            },
        };
        $scope.adjustmentsData = [];
        $scope.expensesData = [];
        $scope.paymentsData = [];

        var debounced = null;

        //$scope.tab.current = 'ATTENTION';
        gotoPeriod(moment().tz('Europe/London').subtract(7, 'days'));

        $scope.$on('SIGNALR_updatePaymentGeneration', function (event) {
            gotoPeriod($scope.currentPeriod.to);
        });

        function openBooking(booking) {
            window.open('/webapp/common/modals/bookings/edit-booking/window.html#?id=' + booking.Id + '&clientId=' + booking.Client.Id, 'EDIT:' + booking.Id, 'height=870,width=1000,left=0,top=0');
        }

        function approvePrice(x) {
            $http.put($config.API_ENDPOINT + 'api/DriverPayments/approvebooking', {}, {
                params: {
                    bookingId: x.Id,
                    driverPaymentId: x.DriverPayment.Id,
                }
            }).success(function (data) {
                var index = $scope.currentPeriod.attentionRequired.indexOf(x);
                $scope.currentPeriod.attentionRequired.splice(index, 1);
            });
        }

        function hasProcessing(data) {
            return $scope.currentPeriod.undergeneration.filter(function (x) {
                return x.DriverId == data.Id;
            }).length > 0;
        }

        function savePrice(x) {
            $http.put($config.API_ENDPOINT + 'api/DriverPayments/updatebooking', {}, {
                params: {
                    bookingId: x.Id,
                    driverPaymentId: x.DriverPayment.Id,
                    commission: x.ManualCommission
                }
            }).success(function (data) {
                var index = $scope.currentPeriod.attentionRequired.indexOf(x);
                $scope.currentPeriod.attentionRequired.splice(index, 1);
                swal('Price Approved', 'Payment is now scheduled for re-calculation.', 'success');
            });
        }

        generateGraph();

        function generateGraph() {
            $scope.graphLoading = true;
            $scope.paymentsGraph = {
                options: {
                    series: {
                        bars: {
                            show: "true"
                        },
                        shadowSize: 0,
                        stack: true,
                        highlightColor: "#4D629E"
                    },
                    bars: {
                        align: "center",
                        fill: 1,
                        barWidth: 0.8,
                        lineWidth: 1,
                        fillColor: {
                            colors: [{
                                opacity: 1
                            }, {
                                opacity: 0.5
                            }]
                        }
                        // barWidth: 1000 * 60 * 60 * 24 * 7 * 0.5
                    },
                    legend: {
                        show: false
                    },
                    grid: {
                        hoverable: true,
                        clickable: true,
                        tickColor: '#1b3952',
                        borderWidth: 0.2,
                        horizontalLines: false,
                        backgroundColor: {
                            colors: ["#fff", "#eee"]
                        }
                    },
                    // colors: ["#a88adc"],
                    xaxis: {
                        tickFormatter: function (v, axis) {
                            return 'W' + v;
                        },
                        tickLength: 0,
                        minTickSize: 1
                    },
                    tooltip: true,
                    tooltipOpts: {
                        content: function (label, xval, yval, flotItem, label) {
                            content = "Week " + flotItem.series.details[flotItem.dataIndex].Week + ", Year " + flotItem.series.details[flotItem.dataIndex].Year
                            content += "<br/>Billed Out: " + flotItem.series.details[flotItem.dataIndex].BilledOut
                            content += "<br/>Bonuses Paid: " + flotItem.series.details[flotItem.dataIndex].BonusesPaid
                            content += "<br/>Invoiced In: " + flotItem.series.details[flotItem.dataIndex].InvoicedIn
                            content += "<br/>Net: %y"
                            return content;
                        },
                        // //     content: "<small>%x</small><br /> <strong>%s</strong> %ymin",
                        // xDateFormat: "%d-%m-%Y",
                        defaultTheme: false
                    },
                    yaxis: {
                        min: 0,
                        position: "right",
                        minTickSize: 1,
                        show: true,
                        tickFormatter: function (val, axis) {
                            return val > 999 ? (val / 1000).toFixed(1).toLocaleString() + 'k' : val;
                        },
                        tickColor: "#ECECE9"
                        //   font:{
                        //    size:8,
                        //    style:"italic",
                        //    weight:"bold",
                        //    family:"sans-serif",
                        //    variant:"small-caps"
                        // }
                    },
                },
                data: []
            };

            graphDataPromise.success(function (data) {
                $scope.graphLoading = false;
                var data = data;
                var driverPaymentsData = {
                    label: 'Payments',
                    data: [],
                    details: [],
                    color: "#455674"
                };
                var thisWeekData = {
                    label: 'Payments',
                    data: [],
                    details: [],
                    color: "#a88adc"
                };
                for (var i = 0; i < data.length; i++) {
                    // driverPaymentsData.data.push([data[i].Week, data[i].Net]);
                    if (data[i].Week == $scope.currentPeriod.week && data[i].Year == $scope.currentPeriod.year) {
                        thisWeekData.details.push(data[i])
                        // thisWeekData.data.push([moment(data[i].Year.toString()).add(data[i].Week, 'weeks'), data[i].Net]);
                        thisWeekData.data.push([data[i].Week, data[i].Net]);
                    } else {
                        driverPaymentsData.details.push(data[i])
                        // driverPaymentsData.data.push([moment(data[i].Year.toString()).add(data[i].Week, 'weeks'), data[i].Net]);
                        driverPaymentsData.data.push([data[i].Week, data[i].Net]);
                    }
                }
                $scope.paymentsGraph.data = []
                $scope.paymentsGraph.data.push(driverPaymentsData);
                $scope.paymentsGraph.data.push(thisWeekData);
            });
        }

        function gotoPeriod(start) {
            $scope.loading = true;
            var startDate = new moment(start);
            $scope.currentPeriod.from = startDate.startOf('isoweek').format();
            $scope.currentPeriod.to = startDate.clone().endOf('isoweek').format();
            $scope.currentPeriod.gen = startDate.clone().endOf('isoweek').add(2, 'days').format();
            $scope.currentPeriod.year = startDate.isoWeekYear();
            $scope.currentPeriod.week = startDate.isoWeek();
            $scope.currentPeriod.stats = {};
            if (debounced) {
                $timeout.cancel(debounced);
                debounced = null;
            }

            debounced = $timeout(function () {
                var startDate = new moment(start);
                var promises = [];

                var a1 = $http.get($config.API_ENDPOINT + 'api/DriverPayments/generatedpayments', {
                    params: {
                        week: $scope.currentPeriod.week,
                        year: $scope.currentPeriod.year,
                    }
                });
                //promises.push(a1);
                a1.success(function (data) {
                    $scope.currentPeriod.payments = [];
                    angular.forEach(data, function (p) {
                        p.Balance = p.BillAmount + p.BonusAmount - p.InvoiceAmount + p.InvoicePayments - p.BillPayments;
                        $scope.currentPeriod.payments.push(p);
                        $scope.allPayments.push(p);
                    });
                });

                var a2 = $http.get($config.API_ENDPOINT + 'api/DriverPayments/undergeneration', {})
                //promises.push(a2);
                a2.success(function (data) {
                    $scope.currentPeriod.undergeneration = data;
                });

                var a3 = $http.get($config.API_ENDPOINT + 'api/DriverPayments/eligabledrivers', {
                    params: {
                        from: $scope.currentPeriod.from,
                        to: $scope.currentPeriod.to,
                    }
                });
                //promises.push(a3);
                a3.success(function (data) {
                    $scope.currentPeriod.eligabledrivers = data;
                });


                var a4 = $http.get($config.API_ENDPOINT + 'api/DriverPayments/attentionRequired', {
                    params: {
                        week: $scope.currentPeriod.week,
                        year: $scope.currentPeriod.year,
                        from: $scope.currentPeriod.from,
                        to: $scope.currentPeriod.to,
                    }
                });
                //promises.push(a4);
                a4.success(function (data) {
                    $scope.currentPeriod.attentionRequired = data;
                });

                var a5 = $http.get($config.API_ENDPOINT + 'api/DriverPayments/extrapayments', {
                    params: {
                        from: $scope.currentPeriod.from,
                        to: $scope.currentPeriod.to,
                    }
                });
                //promises.push(a5);
                a5.success(function (data) {
                    $scope.currentPeriod.extraPayments = data;
                    angular.forEach(data, function (p) {
                        p.Balance = p.BillAmount + p.BonusAmount - p.InvoiceAmount;
                    });
                });

                var a6 = $http.get($config.API_ENDPOINT + 'api/DriverPayments/stats', {
                    params: {
                        week: $scope.currentPeriod.week,
                        year: $scope.currentPeriod.year,
                    }
                });
                promises.push(a6);
                a6.success(function (data) {
                    $scope.currentPeriod.stats = data;
                    $http.get($config.API_ENDPOINT + 'api/DriverPayments/breakdowns', {
                        params: {
                            week: $scope.currentPeriod.week,
                            year: $scope.currentPeriod.year,
                        }
                    }).success(function (breakdownData) {
                        angular.extend(data, breakdownData);
                        $scope.adjustmentsData = [];
                        angular.forEach(breakdownData.driverAdjustments, function (i) {
                            $scope.adjustmentsData.push({
                                label: i.Key,
                                data: i.Value
                            });
                        });
                        $scope.expensesData = [];
                        angular.forEach(breakdownData.expenses, function (i) {
                            $scope.expensesData.push({
                                label: i.Key,
                                data: i.Value
                            });
                        });
                        $scope.paymentsData = [];
                        angular.forEach(breakdownData.paymentBreakdown, function (i) {
                            $scope.paymentsData.push({
                                label: i.Key,
                                data: i.Value
                            });
                        });
                    });
                });

                $q.all(promises).then(function () {
                    $scope.loading = false;
                });

                generateGraph();
            }, 500);
        }

        function forward() {
            gotoPeriod(moment($scope.currentPeriod.from).add(7, 'days'));
        }

        function back() {
            gotoPeriod(moment($scope.currentPeriod.from).subtract(7, 'days'));
        }

        function getSelectedDriversCount() {
            return $scope.currentPeriod.eligabledrivers.filter(function (item) {
                return item.$checked
            }).length;
        }

        function selectAllDrivers() {
            $scope.allDriverSelected = !$scope.allDriverSelected;
            for (var i = 0; i < $scope.currentPeriod.eligabledrivers.length; i++) {
                $scope.currentPeriod.eligabledrivers[i].$checked = $scope.allDriverSelected;
            }
        }

        function autoGenerate() {
            var toQueue = $scope.currentPeriod.eligabledrivers.filter(function (d) {
                return (d.$checked && !hasProcessing(d));
            });
            var model = {
                From: null,
                To: new moment($scope.currentPeriod.to).toDate(),
                Dispute: true
            };

            $modal.open({
                templateUrl: '/webapp/management/driver-payments/all/auto-generate.modal.html',
                controller: ['$scope', '$modalInstance', function ($scope, $modalInstance) {
                    $scope.viewMode = 'EDIT';
                    $scope.count = toQueue.length;
                    $scope.result = model;

                    $scope.confirm = function () {
                        $modalInstance.close($scope.result);
                    }
                }]
            }).result.then(function (config) {
                angular.forEach(toQueue, function (d) {
                    d.$checked = false;
                    d.$status = 'Generating';
                    $http.post($config.API_ENDPOINT + 'api/DriverPayments/autoGenerate', {}, {
                        params: {
                            from: model.From ? new moment(model.From).startOf('day').format() : new moment().subtract(1, 'year').startOf('day').format(),
                            to: new moment(model.To).endOf('day').format(),
                            year: $scope.currentPeriod.year,
                            week: $scope.currentPeriod.week,
                            driverId: d.Id,
                            dispute: model.Dispute
                        }
                    }).success(function (data) {
                        d.$status = 'Ready';
                    }).error(function (data) {
                        d.$status = 'Failed';
                    });
                    swal('Payments Queued', 'Payments have been queued for ' + toQueue.length + ' selected Drivers', 'success');
                });
            });


        }

        function preview() {
            $scope.payment = new Model.DriverPayment();
            $scope.payment.PaymentFrom = null;
            $scope.payment.PaymentTo = new moment().subtract(1, 'week').endOf("isoweek").toDate();
            $scope.payment.Driver = null;
            $scope.payment.PaymentModel = null;
            $scope.opened = {};
            $scope.payment.Bill = new Model.Bill();
            $scope.payment.Bill.DueDate = new moment().add(1, 'month').toDate();

            $scope.payment.Invoice = new Model.Invoice();
            $scope.payment.Invoice.DueDate = new moment().add(1, 'month').toDate();
            $scope.payment.Invoice.InvoiceType = 'Driver';
            $scope.payment.Invoice.PaymentInstructions = $scope.COMPANY.DefaultInvoicePaymentInstructions;
            var driverIds = [];
            for (i = 0, len = $scope.currentPeriod.eligabledrivers.length; i < len; i++) {
                if ($scope.currentPeriod.eligabledrivers[i].$checked && !hasProcessing(d))
                    driverIds.push($scope.currentPeriod.eligabledrivers[i].Id);
            }
            if ($scope.payment.PaymentFrom == null) {
                $scope.payment.PaymentFrom = new moment().subtract(1, 'year').startOf("isoweek").toDate();
            }
            $state.go('root.driverpayments.create', {
                data: {
                    payment: $scope.payment,
                    driverIds: driverIds
                }
            });
        }

        function approvePayment(p, n) {
            //TODO: ask to send email.. etc
            //TODO: hide button on statuses
            //TODO: check attention required bookings

            $http.get($config.API_ENDPOINT + 'api/DriverPayments/approvePayment', {
                params: {
                    paymentId: p.Id
                }
            }).success(function (data) {
                p.Status = 'Approved';
                if (n == undefined) {
                    swal('Payment Approved', 'Payment has been approved and will be emailed to Driver.', 'success');
                }
            });
        }

        function forceApprovePayment(p) {
            //TODO: ask to send email.. etc
            //TODO: hide button on statuses
            //TODO: check attention required bookings
            swal({
                title: "Are you sure?",
                text: "This payment has booking which require attention. Forcing approval will set the commission manually to £0 for these bookings!",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: "Yes, Approve it!",
                cancelButtonText: "Cancel"
            }, function (isConfirm) {
                if (isConfirm) {
                    $http.get($config.API_ENDPOINT + 'api/DriverPayments/forceApprovePayment', {
                        params: {
                            paymentId: p.Id
                        }
                    }).success(function (data) {
                        p.Status = 'Approved';
                        gotoPeriod($scope.currentPeriod.to);
                        swal('Payment Approved', 'Payment has been approved and can be emailed to Driver.', 'success');
                    });
                } else {}
            });


        }

        function startBulkMode(type) {
            $scope.bulkMode = type;
            var test = null;
            if (type == 'APPROVE') {
                $scope.bulkText = 'Approve';
                test = testForApproval;
            }
            if (type == 'BACS') {
                $scope.bulkText = 'Auto-Settle BACS';
                test = testForSettle;
            }
            if (type == 'REGEN') {
                $scope.bulkText = 'Recalculate';
                test = acceptAll;
            }
            if (type == 'CANCEL') {
                $scope.bulkText = 'Cancel';
                test = testForCancel;
            }
            if (type == 'EMAIL') {
                $scope.bulkText = 'Email';
                test = testForEmail;
            }

            angular.forEach($scope.currentPeriod.payments, function (p) {
                p.$bulk = test(p);
            })

            function testForApproval(payment) {
                return payment.Status == 'Draft' && payment.RequiresAttention == 0 && $scope.currentPeriod.undergeneration.filter(function (x) {
                    return x.DriverPaymentId == payment.Id;
                }).length == 0;
            }

            function testForSettle(payment) {
                return payment.Status == 'Approved' && payment.Balance > 0 && $scope.currentPeriod.undergeneration.filter(function (x) {
                    return x.DriverPaymentId == payment.Id;
                }).length == 0;
            }

            function testForEmail(payment) {
                return (payment.Status == 'Settled' || payment.Status == 'Approved') && $scope.currentPeriod.undergeneration.filter(function (x) {
                    return x.DriverPaymentId == payment.Id;
                }).length == 0;
            }

            function testForCancel(payment) {
                return payment.BillPayments == 0 && payment.InvoicePayments == 0 && $scope.currentPeriod.undergeneration.filter(function (x) {
                    return x.DriverPaymentId == payment.Id;
                }).length == 0;
            }

            function acceptAll(payment) {
                return $scope.currentPeriod.undergeneration.filter(function (x) {
                    return x.DriverPaymentId == payment.Id;
                }).length == 0;;
            }
        }

        function cancelBulkMode() {
            $scope.bulkMode = null;
            angular.forEach($scope.currentPeriod.payments, function (p) {
                p.$bulk = false;
                p.$selected = false;
            });
        }

        function finishBulkMode() {
            var selected = $scope.currentPeriod.payments.filter(function (b) {
                return b.$selected;
            });
            if ($scope.bulkMode == 'APPROVE') {
                angular.forEach(selected, approvePayment);
            }
            if ($scope.bulkMode == 'BACS') {
                angular.forEach(selected, autoSettlePayment);
            }
            if ($scope.bulkMode == 'REGEN') {
                angular.forEach(selected, reGeneratePayment);
            }

            if ($scope.bulkMode == 'EMAIL') {
                sendPaymentEmail(selected);
            }
            if ($scope.bulkMode == 'CANCEL') {
                swal({
                    title: "Are you sure?",
                    text: "These payments will be deleted and cannot be recovered.",
                    type: "warning",
                    showCancelButton: true,
                    confirmButtonColor: '#DD6B55',
                    confirmButtonText: 'Confirm',
                    closeOnConfirm: false
                }, function () {
                    swal('Payments Cancelled', 'Payment cancellation is initiated. They will be cancelled in a few moments.', 'success');
                    angular.forEach(selected, cancelPayments);
                });
            }
            cancelBulkMode();
        }

        function reGeneratePayment(p, n) {
            //TODO: Ask if want to use existing payment model or current version.
            //TODO: Ask to recalc bonus?
            //TODO: hide button on statuses
            //TODO: check attention required bookings

            $http.post($config.API_ENDPOINT + 'api/DriverPayments/regenerate', {}, {
                params: {
                    paymentId: p.Id,
                    useStored: true,
                    recalcBonus: true
                }
            }).success(function (data) {
                gotoPeriod($scope.currentPeriod.to);
                if (n == undefined) {
                    swal('Payment Queued', 'Payment has been queued for re-calculation.', 'success');
                }
            });
        }

        function cancelPayments(p, n) {

            $http.delete($config.API_ENDPOINT + 'api/DriverPayments', {
                params: {
                    id: p.Id,
                }
            }).success(function (data) {
                gotoPeriod($scope.currentPeriod.to);
            });

        }

        function sendPaymentEmail(driverPayments) {
            var driverPaymentIds = driverPayments.map(function (p) {
                return p.Id;
            });

            $http.post($config.API_ENDPOINT + 'api/DriverPayments/EmailPayments', driverPaymentIds).success(function (data) {
                gotoPeriod($scope.currentPeriod.to);
            });

        }

        function cancelPayment(p, n) {
            swal({
                title: "Are you sure?",
                text: "This payment will be deleted and cannot be recovered.",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: '#DD6B55',
                confirmButtonText: 'Confirm',
                closeOnConfirm: false
            }, function () {
                swal('Payment Cancelled', 'Payment cancellation is initiated. It will be cancelled in a few moments.', 'success');
                $http.delete($config.API_ENDPOINT + 'api/DriverPayments', {
                    params: {
                        id: p.Id,
                    }
                }).success(function (data) {
                    gotoPeriod($scope.currentPeriod.to);
                });
            });
        }

        function autoSettlePayment(p, n) {
            //TODO: hide button on statuses

            $http.get($config.API_ENDPOINT + 'api/DriverPayments/autoSettlePayment', {
                params: {
                    paymentId: p.Id,
                    method: 'BACS'
                }
            }).success(function (data) {
                gotoPeriod($scope.currentPeriod.to);
                if (n == undefined) {
                    swal('Payment Settled', 'BACS payments have been added.', 'success');
                }
            });
        }

        $scope.exportSummary = function () {
            var query = "" + "week=" + $scope.currentPeriod.week + "&year=" + $scope.currentPeriod.year;
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
        }

    }

    function formatUrl(ImageUrl, text) {
        if (ImageUrl) {
            if (ImageUrl.slice(0, 4) == 'http') {
                return ImageUrl;
            } else {
                return $config.RESOURCE_ENDPOINT + ImageUrl;
            }
        } else {
            return $config.API_ENDPOINT + 'api/imagegen?text=' + text;
        }
    }

    function _formatDate(date) {
        var bdt = moment.tz(date, Localisation.timeZone().getTimeZone());
        return bdt;
    }
})(window, angular);