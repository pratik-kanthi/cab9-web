
(function (window, angular) {
    var module = angular.module('cab9.invoices')
    module.controller('InvoicingSummaryController', InvoicingSummaryController);


    InvoicingSummaryController.$inject = ['$scope', '$http', '$config', '$timeout', 'Model', '$state', '$UI', 'CSV', '$filter', '$q', '$modal'];

    function InvoicingSummaryController($scope, $http, $config, $timeout, Model, $state, $UI, CSV, $filter, $q, $modal) {
        var graphData = null;
        var graphDataPromise = null;
        $scope.currentPeriod = {
            from: null,
            to: null,
            year: null,
            week: null,
            stats: {},
            attentionRequired: [],
            invoices: [],
            allInvoices: [],
            eligable: [],
            extraPayments: [],
            undergeneration: []
        };

        $scope.selected = {
            all: allSelected,
            toggleAll: toggleAll
        };


        $scope.openPaymentModal = openPaymentModal;

        graphDataPromise = $http.get($config.API_ENDPOINT + 'api/Invoice/periods', {
            params: {
                max: 52
                //skip:5
                // from: 11,
                // to: 13
            }
        });

        function allSelected() {
            var result = true;
            angular.forEach($scope.currentPeriod.allInvoices, function (p) {
                if (p.$selected || !(!hasProcessing(p) && $scope.bulkMode && p.$bulk)) {
                    return;
                } else {
                    result = false;
                    return false;
                }
            });
            return result;
        }

        function toggleAll() {
            angular.forEach($scope.currentPeriod.allInvoices, function (p) {
                p.$selected = (!hasProcessing(p) && $scope.bulkMode && p.$bulk);
            });
        }

        function openPaymentModal() {
            var modalInstance = $modal.open({
                templateUrl: '/webapp/management/invoicing/invoices/modals/new-invoice/partial.html',
                controller: 'NewInvoiceInitController',
                keyboard: false,
                backdrop: 'static',
                size: 'lg',
                resolve: {
                    rClients: ['Model', function (Model) {
                        return Model.Client
                            .query()
                            .select('Id,Name,AccountNo,ImageUrl,InvoicePeriod,ClientTypeId,ClientType/Name')
                            .include('ClientType')
                            .parseAs(function (item) {
                                this.Id = item.Id;
                                this.Name = item.Name;
                                this.AccountNo = item.AccountNo;
                                this.InvoicePeriod = item.InvoicePeriod;
                                this.Description = item.ClientType.Name;
                                this.ClientTypeId = item.ClientTypeId;
                                this.ImageUrl = formatUrl(item.ImageUrl, item.Name);
                            })
                            .execute();
                    }],
                }
            })

            modalInstance.result.then(function (data) { }, function () { });
        }

        $scope.tab = {
            current: 'GENERATED'
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
        $scope.lastMonth = moment().subtract(1, 'month').startOf('month').format();
        $scope.currentMonth = moment().startOf('month').format();
        $scope.today = moment();
        $scope.formatUrl = formatUrl;

        $scope.allClientsSelected = false;
        $scope.selectAllClients = selectAllClients;
        $scope.getSelectedClientsCount = getSelectedClientsCount;

        $scope.autoGenerate = autoGenerate;
        //$scope.preview = preview;
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
        gotoPeriod(moment().tz('Europe/London').subtract(1, 'month'), 'Month');

        $scope.$on('SIGNALR_updateInvoiceGeneration', function (event) {
            gotoPeriod($scope.currentPeriod.to, $scope.currentPeriod.type);
        });

        function openBooking(booking) {
            window.open('/webapp/common/modals/bookings/edit-booking/window.html#?id=' + booking.Id + '&clientId=' + booking.Client.Id, 'EDIT:' + booking.Id, 'height=870,width=1000,left=0,top=0');
        }

        function approvePrice(x) {
            $http.put($config.API_ENDPOINT + 'api/Invoice/approvebooking', {}, {
                params: {
                    bookingId: x.Id,
                    invoiceId: x.Invoice.Id,
                }
            }).success(function (data) {
                var index = $scope.currentPeriod.attentionRequired.indexOf(x);
                $scope.currentPeriod.attentionRequired.splice(index, 1);
            });
        }

        function hasProcessing(data) {
            return $scope.currentPeriod.undergeneration.filter(function (x) {
                return x.InvoiceId == data.Id;
            }).length > 0;
        }

        function savePrice(x) {
            $http.put($config.API_ENDPOINT + 'api/Invoice/updatebooking', {}, {
                params: {
                    bookingId: x.Id,
                    invoiceId: x.Invoice.Id,
                    cost: x.InvoiceCost
                }
            }).success(function (data) {
                var index = $scope.currentPeriod.attentionRequired.indexOf(x);
                $scope.currentPeriod.attentionRequired.splice(index, 1);
            });
        }

        //generateGraph();
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
                        fillColor: { colors: [{ opacity: 1 }, { opacity: 0.5 }] }
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
                        backgroundColor: { colors: ["#fff", "#eee"] }
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

        function gotoPeriod(start, type) {
            $scope.loading = true;
            var startDate = new moment(start);
            if (type == 'Week') {
                $scope.currentPeriod.from = startDate.startOf('isoweek').format();
                $scope.currentPeriod.to = startDate.clone().endOf('isoweek').format();
                $scope.currentPeriod.gen = startDate.clone().endOf('isoweek').add(2, 'days').format();
                $scope.currentPeriod.week = startDate.isoWeek();
            } else {
                $scope.currentPeriod.from = startDate.startOf('month').format();
                $scope.currentPeriod.to = startDate.clone().endOf('month').format();
                $scope.currentPeriod.gen = startDate.clone().endOf('month').add(2, 'days').format();
                $scope.currentPeriod.week = null;
            }
            $scope.currentPeriod.year = startDate.year();
            $scope.currentPeriod.month = startDate.month() + 1;
            $scope.currentPeriod.weeks = [];
            $scope.currentPeriod.type = type;
            

            var current = new moment(startDate.clone().startOf('month'));
            var max = new moment(startDate.clone().endOf('month'));

            $scope.currentPeriod.thisMonth = {
                weekStart: current.format(),
                type: 'Month',
                title: 'All',
                subtitle: current.format('MMMM YYYY')
            };

            current = current.startOf('isoweek');

            while (current.isBefore(max) && current.isBefore(new moment())) {
                var c = current.clone().startOf('isoweek');
                $scope.currentPeriod.weeks.push({
                    weekStart: c.format(),
                    type: 'Week',
                    title: 'Week: ' + c.isoWeek(),
                    subtitle: 'WS: ' + c.format('DD/MM/YYYY')
                });

                current = current.add(7, 'days');
            }
            
            $scope.currentPeriod.stats = {};
            if (debounced) {
                $timeout.cancel(debounced);
                debounced = null;
            }

            debounced = $timeout(function () {
                var startDate = new moment(start);
                var promises = [];

                var a1 = $http.get($config.API_ENDPOINT + 'api/Invoice/generated', {
                    params: {
                        week: $scope.currentPeriod.week,
                        month: $scope.currentPeriod.month,
                        year: $scope.currentPeriod.year,
                    }
                });
                promises.push(a1);
                a1.success(function (data) {
                    $scope.currentPeriod.invoices = {};
                    $scope.currentPeriod.allInvoices = [];
                    $scope.currentPeriod.invoices[new moment($scope.currentPeriod.from).format('MMM')] = [];
                    angular.forEach(data, function (p) {
                        p.Balance = p.InvoiceAmount - p.PaymentsTotal;
                        $scope.currentPeriod.allInvoices.push(p);
                        if (!p.Week) {
                            $scope.currentPeriod.invoices[new moment($scope.currentPeriod.from).format('MMM')].push(p)
                        } else {
                            if (!$scope.currentPeriod.invoices['Week ' + p.Week]) {
                                $scope.currentPeriod.invoices['Week ' + p.Week] = [];
                            }
                            $scope.currentPeriod.invoices['Week ' + p.Week].push(p);
                        }
                    });
                });

                var a2 = $http.get($config.API_ENDPOINT + 'api/Invoice/undergeneration', {})
                promises.push(a2);
                a2.success(function (data) {
                    $scope.currentPeriod.undergeneration = data;
                });

                var a3 = $http.get($config.API_ENDPOINT + 'api/Invoice/eligable', {
                    params: {
                        from: $scope.currentPeriod.from,
                        to: $scope.currentPeriod.to,
                        week: $scope.currentPeriod.week,
                        month: $scope.currentPeriod.month,
                        year: $scope.currentPeriod.year,
                        type: $scope.currentPeriod.type
                    }
                });
                promises.push(a3);
                a3.success(function (data) {
                    $scope.currentPeriod.eligable = data;
                });


                var a4 = $http.get($config.API_ENDPOINT + 'api/Invoice/attentionRequired', {
                    params: {
                        week: $scope.currentPeriod.week,
                        month: $scope.currentPeriod.month,
                        year: $scope.currentPeriod.year
                    }
                });
                promises.push(a4);
                a4.success(function (data) {
                    $scope.currentPeriod.attentionRequired = data;
                });

                var a5 = $http.get($config.API_ENDPOINT + 'api/Invoice/extrapayments', {
                    params: {
                        from: $scope.currentPeriod.from,
                        to: $scope.currentPeriod.to,
                    }
                });
                promises.push(a5);
                a5.success(function (data) {
                    $scope.currentPeriod.extraPayments = data;
                    angular.forEach(data, function (p) {
                        p.Balance = p.InvoiceAmount - p.PaymentsTotal;
                    });
                });

                //var a6 = $http.get($config.API_ENDPOINT + 'api/Invoice/stats', {
                //    params: {
                //        week: $scope.currentPeriod.week,
                //        month: $scope.currentPeriod.month,
                //        year: $scope.currentPeriod.year,
                //    }
                //});
                //promises.push(a6);
                //a6.success(function (data) {
                //    $scope.currentPeriod.stats = data;
                //    $scope.adjustmentsData = [];
                //    angular.forEach(data.driverAdjustments, function (i) {
                //        $scope.adjustmentsData.push({
                //            label: i.Key,
                //            data: i.Value
                //        });
                //    });
                //    $scope.expensesData = [];
                //    angular.forEach(data.expenses, function (i) {
                //        $scope.expensesData.push({
                //            label: i.Key,
                //            data: i.Value
                //        });
                //    });
                //    $scope.paymentsData = [];
                //    angular.forEach(data.paymentBreakdown, function (i) {
                //        $scope.paymentsData.push({
                //            label: i.Key,
                //            data: i.Value
                //        });
                //    });

                //});

                $q.all(promises).then(function () {
                    $scope.loading = false;
                });

                //generateGraph();
            }, 500);
        }

        function forward() {
            gotoPeriod(moment($scope.currentPeriod.from).add(1, 'month'), 'Month');
        }

        function back() {
            gotoPeriod(moment($scope.currentPeriod.from).subtract(1, 'month'), 'Month');
        }

        function getSelectedClientsCount() {
            return $scope.currentPeriod.eligable.filter(function (item) {
                return item.$checked
            }).length;
        }

        function selectAllClients() {
            $scope.allClientsSelected = !$scope.allClientsSelected;
            for (var i = 0; i < $scope.currentPeriod.eligable.length; i++) {
                $scope.currentPeriod.eligable[i].$checked = $scope.allClientsSelected;
            }
        }

        function autoGenerate() {
            var count = 0;
            angular.forEach($scope.currentPeriod.eligable, function (d) {
                if (d.$checked && !hasProcessing(d)) {
                    d.$checked = false;
                    d.$status = 'Generating';
                    count++;
                    $http.post($config.API_ENDPOINT + 'api/Invoice/autoGenerate', {}, {
                        params: {
                            from: $scope.currentPeriod.from,
                            to: $scope.currentPeriod.to,
                            year: $scope.currentPeriod.year,
                            month: $scope.currentPeriod.month,
                            week: $scope.currentPeriod.week,
                            clientId: d.Id,
                        }
                    }).success(function (data) {
                        d.$status = 'Ready';
                    }).error(function (data) {
                        d.$status = 'Failed';
                    });
                }
            });
            swal('Invoices Queued', 'Invoices have been queued for ' + count + ' selected Client(s)', 'success');
        }

        function approvePayment(p, n) {
            //TODO: ask to send email.. etc
            //TODO: hide button on statuses
            //TODO: check attention required bookings

            $http.get($config.API_ENDPOINT + 'api/Invoice/approve', {
                params: {
                    invoiceId: p.Id
                }
            }).success(function (data) {
                p.Status = 'Approved';
                if (n == undefined) {
                    swal('Payment Approved', 'Payment has been approved and will be emailed to Client.', 'success');
                }
            });
        }

        function forceApprovePayment(p) {
            //TODO: ask to send email.. etc
            //TODO: hide button on statuses
            //TODO: check attention required bookings
            swal({
                title: "Are you sure?",
                text: "This payment has booking(s) which require attention. Forcing approval will set the Invoice Cost manually to �0 for these bookings!",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: "Yes, Approve it!",
                cancelButtonText: "Cancel"
            }, function (isConfirm) {
                if (isConfirm) {
                    $http.get($config.API_ENDPOINT + 'api/Invoice/forceApprovePayment', {
                        params: {
                            paymentId: p.Id
                        }
                    }).success(function (data) {
                        p.Status = 'Approved';
                        gotoPeriod($scope.currentPeriod.to, $scope.currentPeriod.type);
                        swal('Invoice Approved', 'Invoice has been approved and can be emailed to Client.', 'success');
                    });
                } else { }
            });


        }

        function startBulkMode(type, manual) {
            if (manual) {
                $scope.manualBulkMode = type;
                var test = null;
                if (type == 'APPROVE') {
                    $scope.manualBulkText = 'Approve';
                    test = testForApproval;
                }
                if (type == 'SEND') {
                    $scope.manualBulkText = 'Send to Client';
                    test = testForSend;
                }
                if (type == 'CANCEL') {
                    $scope.manualBulkText = 'Cancel';
                    test = testForCancel;
                }
            } else {
                $scope.bulkMode = type;
                var test = null;
                if (type == 'APPROVE') {
                    $scope.bulkText = 'Approve';
                    test = testForApproval;
                }
                if (type == 'SEND') {
                    $scope.bulkText = 'Send to Client';
                    test = testForSend;
                }
                if (type == 'CANCEL') {
                    $scope.bulkText = 'Cancel';
                    test = testForCancel;
                }
            }

            if (manual) {
                angular.forEach($scope.currentPeriod.extraPayments, function (p) {
                    p.$bulk = test(p);
                })
            } else {
                angular.forEach($scope.currentPeriod.allInvoices, function (p) {
                    p.$bulk = test(p);
                })
            }

            function testForApproval(payment) {
                return payment.Status == 'Draft' && payment.RequiresAttention == 0 && $scope.currentPeriod.undergeneration.filter(function (x) {
                    return x.InvoiceId == payment.Id;
                }).length == 0;
            }

            function testForSettle(payment) {
                return payment.Status == 'Approved' && $scope.currentPeriod.undergeneration.filter(function (x) {
                    return x.InvoiceId == payment.Id;
                }).length == 0;
            }

            function testForSend(payment) {
                return payment.Status == 'Approved' && $scope.currentPeriod.undergeneration.filter(function (x) {
                    return x.InvoiceId == payment.Id;
                }).length == 0;
            }

            function testForCancel(payment) {
                return payment.PaymentsTotal == 0 && $scope.currentPeriod.undergeneration.filter(function (x) {
                    return x.InvoiceId == payment.Id;
                }).length == 0;
            }

            function acceptAll(payment) {
                return $scope.currentPeriod.undergeneration.filter(function (x) {
                    return x.InvoiceId == payment.Id;
                }).length == 0;;
            }
        }

        function cancelBulkMode(manual) {
            if (manual) {
                $scope.manualBulkMode = null;
                angular.forEach($scope.currentPeriod.extraPayments, function (p) {
                    p.$bulk = false;
                    p.$selected = false;
                });
            } else {
                $scope.bulkMode = null;
                angular.forEach($scope.currentPeriod.allInvoices, function (p) {
                    p.$bulk = false;
                    p.$selected = false;
                });
            }
        }

        function finishBulkMode(manual) {
            if (manual) {
                var selected = $scope.currentPeriod.extraPayments.filter(function (b) {
                    return b.$selected;
                });
                if ($scope.manualBulkMode == 'APPROVE') {
                    angular.forEach(selected, approvePayment);
                }
                if ($scope.manualBulkMode == 'SEND') {
                    var ids = selected.map(function (x) { return x.Id; });
                    $http.post($config.API_ENDPOINT + 'api/invoice/bulksend', ids).then(function () {
                        swal('Success', 'Emails have been queued and Invoices will be emailed shortly.', 'success');
                    });
                }
                if ($scope.manualBulkMode == 'CANCEL') {
                    angular.forEach(selected, cancelPayment);
                }
            } else {
                var selected = $scope.currentPeriod.allInvoices.filter(function (b) {
                    return b.$selected;
                });
                if ($scope.bulkMode == 'APPROVE') {
                    angular.forEach(selected, approvePayment);
                }
                if ($scope.bulkMode == 'SEND') {
                    var ids = selected.map(function (x) { return x.Id; });
                    $http.post($config.API_ENDPOINT + 'api/invoice/bulksend', ids).then(function () {
                        swal('Success', 'Emails have been queued and Invoices will be emailed shortly.', 'success');
                    });
                }
                if ($scope.bulkMode == 'CANCEL') {
                    angular.forEach(selected, cancelPayment);
                }
            }
            cancelBulkMode(manual);
        }

        function reGeneratePayment(p, n) {
            //TODO: Ask if want to use existing payment model or current version.
            //TODO: Ask to recalc bonus?
            //TODO: hide button on statuses
            //TODO: check attention required bookings

            $http.post($config.API_ENDPOINT + 'api/Invoice/regenerate', {}, {
                params: {
                    paymentId: p.Id,
                    useStored: true,
                    recalcBonus: true
                }
            }).success(function (data) {
                gotoPeriod($scope.currentPeriod.to, $scope.currentPeriod.type);
                if (n == undefined) {
                    swal('Invoice Queued', 'Invoice has been queued for re-calculation.', 'success');
                }
            });
        }

        function cancelPayment(p, n) {
            //TODO: Ask are you sure?

            $http.delete($config.API_ENDPOINT + 'api/Invoice', {
                params: {
                    id: p.Id,
                }
            }).success(function (data) {
                gotoPeriod($scope.currentPeriod.to, $scope.currentPeriod.type);
                if (n == undefined) {
                    swal('Invoice Cancelled', 'Invoice has been removed', 'success');
                }
            });
        }

        function autoSettlePayment(p, n) {
            //TODO: hide button on statuses

            $http.get($config.API_ENDPOINT + 'api/Invoice/autoSettlePayment', {
                params: {
                    paymentId: p.Id,
                    method: 'BACS'
                }
            }).success(function (data) {
                gotoPeriod($scope.currentPeriod.to, $scope.currentPeriod.type);
                if (n == undefined) {
                    swal('Payment Settled', 'BACS payments have been added.', 'success');
                }
            });
        }

        $scope.exportSummary = function () {
            var query = "" + "week=" + $scope.currentPeriod.week + "&year=" + $scope.currentPeriod.year;
            $http.get($config.API_ENDPOINT + 'api/invoice/Summary?' + query).then(function (response) {
                CSV.download(response.data, "InvoiceSummary.csv");
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

})(window, angular);