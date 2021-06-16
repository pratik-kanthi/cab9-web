(function () {
    var module = angular.module('cab9.driverpayments');

    module.controller('DriverPaymentsCreateController', driverPaymentsCreateController);

    var $AnchorScrollProvider = function () {
        this.$get = ['$window', '$location', '$rootScope', function ($window, $location, $rootScope) {
            function scroll() {}
            return scroll;
        }];
    }
    module.provider('$anchorScroll', $AnchorScrollProvider);

    driverPaymentsCreateController.$inject = ['$scope', '$rootScope', '$anchorScroll', '$modal', 'rDrivers', 'Model', 'rTabs', '$http', '$filter', '$config', '$state', '$q', '$UI', '$stateParams'];

    function driverPaymentsCreateController($scope, $rootScope, $anchorScroll, $modal, rDrivers, Model, rTabs, $http, $filter, $config, $state, $q, $UI, $stateParams) {
        if (!$stateParams.data) {
            $state.go('root.driverpayments');
            return;
        }
        $scope.payment = $stateParams.data.payment;
        $scope.selected = {
            DriverIds: $stateParams.data.driverIds,
            From: $stateParams.data.payment.PaymentFrom,
            To: $stateParams.data.payment.PaymentTo,
        };
        fetchBookings();
        $scope.drivers = rDrivers;
        $scope.tabDefs = rTabs;
        $scope.displayMode = 'CREATE';
        $scope.allInvoiceSelected = true;
        $scope.allBillsSelected = true;
        $scope.allAdjustmentsSelected = true;
        $scope.InvoiceBookings = [];
        $scope.BillBookings = [];

        $scope.updateBooking = updateBooking;
        $scope.expand = expand;
        $scope.details = details;
        $scope.fetchBookings = fetchBookings;
        $scope.openEditWindow = openEditWindow;
        $scope.BookingsTotal = BookingsTotal;
        $scope.calculateDue = calculateDue;
        $scope.getSelectedBookings = getSelectedBookings;
        $scope.toggleSelectAll = toggleSelectAll;
        $scope.save = save;
        $scope.Cancel = cancel;
        $scope.showBreakdown = showBreakdown;

        function showBreakdown(item) {
            var modalInstance = $modal.open({
                templateUrl: '/webapp/common/modals/bookings/driver-payment-calculation/partial.html',
                controller: 'BookingDriverPaymentCalculationController',
                resolve: {
                    rBooking: function () {
                        return item;
                    }
                }
            })
        }

        function openEditWindow(booking, repeat) {
            if (repeat) {
                window.open('/webapp/common/modals/bookings/reuse-booking/window.html#?id=' + booking.Id + '&clientId=' + booking.ClientId + '&repeat=true', '_blank', 'height=870,width=1000,left=0,top=0');
            } else {
                $http.get($config.API_ENDPOINT + 'api/bookings/RequestLock', {
                    params: {
                        bookingId: booking.Id
                    }
                }).success(function (response) {
                    if (response.status == 'LockGranted') {
                        window.open('/webapp/common/modals/bookings/edit-booking/window.html#?id=' + booking.Id + '&clientId=' + booking.ClientId, '_blank', 'height=870,width=1000,left=0,top=0');
                    } else {
                        swal('Booking Locked!', "This booking is currently being edited by: " + response.user, 'error');
                    }
                }).error(function () {
                    swal('Error!', "Unknown error occured.", 'error');
                })
            }
        }

        function updateBooking(item, type) {
            item.Booking.$patch().then(function (response) {
                var inputs = {
                    From: $scope.selected.From,
                    To: $scope.selected.To,
                    DriverIds: [item.Booking.DriverId]
                }
                $http.post($config.API_ENDPOINT + 'api/driverpayments/previews', inputs).then(function (results) {
                    var data = createPreviewObject(item.Booking.DriverId, results.data.NewPayments, results.data.ExistingPayments);
                    for (i = 0, len = $scope.data.length; i < len; i++) {
                        if ($scope.data[i].Driver.Id == item.Booking.DriverId) {
                            $scope.data[i] = data;
                            break;
                        }
                    }
                    $scope.selectedItem = data;
                })
            }, function (err) {
                swal({
                    title: "Some Error Occured.",
                    text: "Some error has occured.",
                    type: "error",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
            })

        }


        function details(type) {
            if (type == 'Invoice')
                $state.go('root.driverpayments.create.invoice');
            if (type == 'Bill')
                $state.go('root.driverpayments.create.bill');
        }


        function expand(item) {
            $scope.selectedItem = item;
        }

        function fetchBookings() {
            $scope.fetching = true;
            $http.post($config.API_ENDPOINT + 'api/driverpayments/previews', $scope.selected).then(function (results) {
                $scope.data = [];
                var newPayments = results.data.NewPayments;
                var existingPayments = results.data.ExistingPayments;
                for (var p in newPayments) {
                    $scope.data.push(createPreviewObject(p, newPayments, existingPayments));
                }
                $state.go('root.driverpayments.create.summary');
                $scope.fetching = false;
            });
        }

        function createPreviewObject(p, newPayments, existingPayments) {
            if (!$scope.data)
                $scope.data = [];
            newPayments[p].InvoiceBookings = newPayments[p].InvoiceBookings.map(function (item) {
                item.Booking = new Model.Booking(item.Booking);
                item.Booking.$selected = true;
                return item;
            });
            newPayments[p].BillBookings = newPayments[p].BillBookings.map(function (item) {
                item.Booking = new Model.Booking(item.Booking);
                item.Booking.$selected = true;
                return item;
            });
            newPayments[p].Adjustments = newPayments[p].Adjustments.map(function (item) {
                var x = new Model.DriverPaymentAdjustment(item);
                x.$selected = true;
                return x;
            });

            var obj = newPayments[p];
            obj.conflicts = existingPayments.filter(function (item) {
                return item.DriverId == p
            })

            obj.Driver = $scope.drivers.filter(function (item) {
                return item.Id == p
            })[0]
            return obj;
        }

        function getCommissionValue(type, booking) {
            //OwnCarCommission value for booking
            if (booking && booking.VehicleId && booking.Vehicle.DriverId == booking.DriverId)
                return type == 'Invoice' ? (100 - $scope.payment.PaymentModel.OwnCarCommission) : $scope.payment.PaymentModel.OwnCarCommission;

            //CompanyCarCommission value for booking
            if (booking && (!booking.VehicleId || (booking.VehicleId && booking.Vehicle.DriverId != booking.DriverId)))
                return type == 'Invoice' ? (100 - $scope.payment.PaymentModel.CompanyCarCommission) : $scope.payment.PaymentModel.CompanyCarCommission;
        }

        function BookingsTotal(type) {
            if (!$scope.selectedItem)
                return 0;
            var res = 0;
            var bookings = [];

            if (type == 'Invoice')
                bookings = $scope.selectedItem.InvoiceBookings;
            if (type == 'Bill')
                bookings = $scope.selectedItem.BillBookings;
            angular.forEach(bookings, function (b) {
                res = res + b.Booking.ActualCost;
            });
            return res;
        }

        function calculateDue(type) {
            if (!$scope.selectedItem)
                return 0;
            var res = 0;

            if (type == 'Invoice') {
                $scope.selectedItem.InvoiceBookings.forEach(function (b) {
                    res = res + b.Booking.JourneyCommission + b.Booking.ExtrasCommission + b.Booking.WaitingCommission;
                })
            }
            if (type == 'Bill') {
                $scope.selectedItem.BillBookings.forEach(function (b) {
                    res = res + b.Booking.JourneyCommission + b.Booking.ExtrasCommission + b.Booking.WaitingCommission;
                })
            }
            return res;
        }

        function getSelectedBookings(type) {
            var bookings = [];
            if (type == 'Invoice') {
                $scope.selectedItem.InvoiceBookings.forEach(function (b) {
                    if (b.Booking.$selected)
                        bookings.push(b);
                });
            }
            if (type == 'Bill') {
                $scope.selectedItem.BillBookings.forEach(function (b) {
                    if (b.Booking.$selected)
                        bookings.push(b);
                });
            }
            return bookings;
        }

        function toggleSelectAll(type) {
            if (type == 'Invoice') {
                $scope.allInvoiceSelected = !$scope.allInvoiceSelected;
                for (i = 0, len = $scope.selectedItem.InvoiceBookings.length; i < len; i++) {
                    if ($scope.allInvoiceSelected)
                        $scope.selectedItem.InvoiceBookings[i].Booking.$selected = true;
                    else
                        $scope.selectedItem.InvoiceBookings[i].Booking.$selected = false;
                }
            }
            if (type == 'Bill') {
                $scope.allBillsSelected = !$scope.allBillsSelected;
                for (i = 0, len = $scope.selectedItem.BillBookings.length; i < len; i++) {
                    if ($scope.allBillsSelected)
                        $scope.selectedItem.BillBookings[i].Booking.$selected = true;
                    else
                        $scope.selectedItem.BillBookings[i].Booking.$selected = false;
                }
            }
            if (type == 'Adjustment') {
                $scope.allAdjustmentsSelected = !$scope.allAdjustmentsSelected;
                for (i = 0, len = $scope.selectedItem.Adjustments.length; i < len; i++) {
                    $scope.selectedItem.Adjustments[i].$selected = $scope.allAdjustmentsSelected;
                }
            }
        }

        function save() {
            var invoiceBookings = [];
            for (i = 0, len = $scope.selectedItem.InvoiceBookings.length; i < len; i++) {
                if ($scope.selectedItem.InvoiceBookings[i].Booking.$selected)
                    invoiceBookings.push($scope.selectedItem.InvoiceBookings[i].Booking)
            }

            var billBookings = [];
            for (i = 0, len = $scope.selectedItem.BillBookings.length; i < len; i++) {
                if ($scope.selectedItem.BillBookings[i].Booking.$selected)
                    billBookings.push($scope.selectedItem.BillBookings[i].Booking)
            }

            var adjustments = [];
            for (i = 0, len = $scope.selectedItem.Adjustments.length; i < len; i++) {
                if ($scope.selectedItem.Adjustments[i].$selected)
                    adjustments.push($scope.selectedItem.Adjustments[i])
            }

            if (invoiceBookings.length == 0 && billBookings.length == 0) {
                swal({
                    title: "No bookings selected.",
                    text: "Please tick the bookings you would like to make payment for.",
                    type: "warning",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
                return;
            }
            swal({
                title: "Are you sure?",
                text: "Payment would be created.",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: $UI.COLOURS.brandPrimary,
                confirmButtonText: "Confirm!",
                showLoaderOnConfirm: true,
                closeOnConfirm: false
            }, function () {
                $scope.payment.DriverId = $scope.selectedItem.Driver.Id;
                $scope.payment.PaymentModelId = $scope.selectedItem.Driver.DefaultDriverPaymentModel ? $scope.selectedItem.Driver.DefaultDriverPaymentModel.Id : ($scope.selectedItem.Driver.DriverType && $scope.selectedItem.Driver.DriverType.DefaultDriverPaymentModel ? $scope.selectedItem.Driver.DriverType.DefaultDriverPaymentModel.Id : $scope.COMPANY.DefaultDriverPaymentModel.Id);
                if (!$scope.payment.Bill.Reference)
                    $scope.payment.Bill.Reference = 'AUTO';
                if (!$scope.payment.Invoice.Reference)
                    $scope.payment.Invoice.Reference = 'AUTO';
                $scope.payment.Bookings = [];


                //if (invoiceBookings.length == 0) {
                //    $scope.payment.Invoice = null;
                //} else {
                    $scope.payment.Bookings = invoiceBookings;
                    $scope.payment.Invoice.DriverId = $scope.selectedItem.Driver.Id
                //}

                //if (billBookings.length == 0) {
                //    $scope.payment.Bill = null;
                //} else {
                    $scope.payment.Bill.DriverId = $scope.selectedItem.Driver.Id
                    Array.prototype.push.apply($scope.payment.Bookings, billBookings);
                //}

                $scope.payment.Adjustments = adjustments;
                $scope.payment.Driver = null;
                $scope.payment.PaymentModel = null;

                $scope.payment.$save().success(function (res) {
                    swal({
                        title: "Driver Payment Saved.",
                        text: "Driver Payment has been added.",
                        type: "success",
                        confirmButtonColor: $UI.COLOURS.brandSecondary,
                        showLoaderOnConfirm: true
                    });
                    var index = $scope.data.indexOf($scope.selectedItem);
                    $scope.data.splice(index, 1);
                    $scope.selectedItem = null;
                    if ($scope.data.length == 0) {
                        $state.go('root.driverpayments', null, {
                            reload: true
                        });
                    }
                }).error(function (err) {
                    var msg = null;
                    if (err && err.Message == "INVALID REFERENCE")
                        msg = 'Reference already exists!'
                    swal({
                        title: "Error Occured",
                        text: msg,
                        type: 'error'
                    });
                });
            })
        }

        function cancel() {
            $state.go('root.driverpayments', null, {
                reload: true
            });
        }

    }
}())