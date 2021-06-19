(function () {
    var module = angular.module('cab9.driverpayments');

    module.controller('DriverPaymentsItemController', driverPaymentsItemController);

    driverPaymentsItemController.$inject = ['$scope', '$stateParams', '$http', 'rDPayment', 'rDrivers', 'rTabs', '$state', 'Model', '$filter', '$UI', '$config', '$q', 'Auth', '$window', '$modal', 'rAdjustments', 'Notification', 'rTaxes'];

    function driverPaymentsItemController($scope, $stateParams, $http, rDPayment, rDrivers, rTabs, $state, Model, $filter, $UI, $config, $q, Auth, $window, $modal, rAdjustments, Notification, rTaxes) {
        $scope.payment = rDPayment[0];
        $scope.drivers = rDrivers;
        $scope.adjustments = rAdjustments;
        $scope.taxes = rTaxes;
        $scope.billAdjustments = rAdjustments.filter(function (x) {
            return x.Type == 'Credit' && !x.BookingId;
        });
        $scope.invoiceAdjustments = rAdjustments.filter(function (x) {
            return x.Type == 'Debit' && !x.BookingId;
        });

        createPreviewObject();

        //        if (($scope.payment.Bill && $scope.payment.Bill.BillPayments.length > 0) || ($scope.payment.Invoice && $scope.payment.Invoice.Payments.length > 0))
        $scope.displayMode = 'VIEW';
        $scope.tabDefs = rTabs;

        // to get formatted imageUrl of driver and display in the right
        if ($scope.payment.Driver) {
            $scope.payment.Driver.ImageUrl = formatUrl($scope.payment.Driver.ImageUrl, $scope.payment.Driver.Callsign);
        }

        $scope.opened = {};

        $scope.editing = {
            adjustment: null
        };


        //separate bill and invoice bookings from payment bookings
        bookingsInitialise();

        $scope.remove = remove;
        $scope.showBreakdown = showBreakdown;
        $scope.editMode = editMode;
        $scope.openCalendar = openCalendar;
        $scope.details = details;
        $scope.BookingsTotal = BookingsTotal;
        $scope.TaxTotal = TaxTotal;
        $scope.calculateDue = calculateDue;
        $scope.toggleSelectAll = toggleSelectAll;
        $scope.Save = save;
        $scope.Cancel = cancel;
        $scope.getSelectedBookings = getSelectedBookings;
        $scope.exportInvoice = exportInvoice;
        $scope.exportCompanyInvoice = exportCompanyInvoice;
        $scope.updateBooking = updateBooking;
        $scope.recalculate = recalculate;
        $scope.removeBookings = removeBookings;
        $scope.emailTo = emailTo;
        $scope.creating = {};

        $scope.addAdjustment = addAdjustment;
        $scope.startEditAdjustment = startEditAdjustment;
        $scope.cancelEditAdjustment = cancelEditAdjustment;
        $scope.removeAdjustment = removeAdjustment;
        $scope.saveEditAdjustment = saveEditAdjustment;
        $scope.saveNewAdjustment = saveNewAdjustment;
        $scope.cancelNewAdjustment = cancelNewAdjustment;

        function addAdjustment(type) {
            $scope.creating.adjustment = {
                Type: (type == 'invoice') ? 'Debit' : 'Credit',
                TaxId: $scope.taxes[1].Id
            };

        }

        function saveNewAdjustment() {
            var x = new Model.DriverAdjustment({
                DriverId: $scope.payment.DriverId,
                Type: $scope.creating.adjustment.Type,
                Amount: $scope.creating.adjustment.Amount,
                Reference: $scope.creating.adjustment.Reference,
                Recurring: 'OneOff',
                AmountType: 'Fixed',
                Approved: true,
                Settled: true,
                TaxId: $scope.creating.adjustment.TaxId
            });
            x.$save().then(function (response) {
                var aId = response.data.Id;
                var y = new Model.DriverPaymentAdjustment({
                    DriverPaymentId: $scope.payment.Id,
                    DriverAdjustmentId: aId,
                    Type: $scope.creating.adjustment.Type,
                    Amount: $scope.creating.adjustment.Amount,
                    Reference: $scope.creating.adjustment.Reference,
                    TaxId: $scope.creating.adjustment.TaxId
                });
                y.$save().then(function () {
                    swal({
                        title: 'Adjustment Added',
                        type: 'success',
                        text: 'Adjustment has been added, page will refresh to reflect changes'
                    }, function () {
                        location.reload();
                    });
                });
            });
            //save driver adjustment
            //save driver payment adjustment
        }

        function cancelNewAdjustment() {
            $scope.creating.adjustment = null;
        }

        function startEditAdjustment(adjustment) {
            if ($scope.editing.adjustment) {
                cancelEditAdjustment();
            }
            $scope.editing.adjustment = adjustment;
        }

        function cancelEditAdjustment() {
            $scope.editing.adjustment.$rollback();
            $scope.editing.adjustment = null;
        }

        function removeAdjustment(adjustment) {
            adjustment.$delete().then(function () {
                location.reload();
            });
        }

        function saveEditAdjustment() {
            $scope.editing.adjustment.$patch().then(function () {
                location.reload();
            });
        }

        function openEditAdjustment(adjustment) {
            $modal.open({
                templateUrl: '/webapp/management/driver-payments/item/adjustment-edit.modal.html',
                controller: ['$scope', 'rAdjustment', '$modalInstance', function ($scope, rAdjustment, $modalInstace) {
                    $scope.adjustment = rAdjustment;
                }],
                resolve: {
                    rAdjustment: function () {
                        return adjustment;
                    }
                }
            }).result.then(function () {
                alert('refresh here');
            });
        }


        function editMode() {
            $scope.displayMode = 'EDIT';
        }

        function openCalendar(event, name) {
            $scope.opened[name] = true;
            event.preventDefault();
            event.stopPropagation();
        }

        function details(type) {
            if (type == 'Invoice')
                $state.go('root.driverpayments.viewer.invoice');
            if (type == 'Bill')
                $state.go('root.driverpayments.viewer.bill');
        }

        function createPreviewObject() {
            $scope.selectedItem = {
                InvoiceBookings: [],
                BillBookings: []
            };
            for (var i = 0; i < $scope.payment.Bookings.length; i++) {
                if ($scope.payment.Bookings[i].CompanyCommission > 0) {
                    $scope.selectedItem.InvoiceBookings.push({
                        Booking: new Model.Booking($scope.payment.Bookings[i]),
                        Total: $scope.payment.Bookings[i].CompanyCommission
                    })
                }
                if ($scope.payment.Bookings[i].DriverCommission > 0) {
                    $scope.selectedItem.BillBookings.push({
                        Booking: new Model.Booking($scope.payment.Bookings[i]),
                        Total: $scope.payment.Bookings[i].DriverCommission
                    })
                }
            }
        }

        function remove() {
            swal({
                title: "Are you sure?",
                text: "Are you sure you want to delete this Driver Payment?",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: "Yes, delete it!",
                cancelButtonText: "Cancel",
                closeOnConfirm: false
            }, function (isConfirm) {
                if (isConfirm) {
                    $scope.payment.$delete(true).then(function () {
                        swal({
                            title: "Driver Payment Deleted.",
                            text: "Driver Payment has been removed.",
                            type: "success",
                            confirmButtonColor: $UI.COLOURS.brandSecondary
                        });
                        $state.go('root.driverpayments', {
                            reload: true
                        });
                    });
                }
            });
        }

        function updateBooking(item, type) {
            item.Booking.$patch().then(function (response) {
                var inputs = {
                    From: $scope.payment.PaymentFrom,
                    To: $scope.payment.PaymentTo,
                    DriverIds: [item.Booking.DriverId]
                }
                Model.DriverPayment.query()
                    .include('Driver', 'PaymentModel', 'Invoice/Payments', 'Bill/BillPayments', 'Bookings/LeadPassenger, Bookings/BookingStops, Bookings/Vehicle')
                    .where('Id', '==', "guid'" + $stateParams.Id + "'")
                    .trackingEnabled()
                    .execute().then(function (response) {
                        $scope.payment = response[0];
                        createPreviewObject();
                        $scope.fareUpdated = false;
                    }, function (err) {
                        swal({
                            title: "Some Error Occured.",
                            text: "Some error has occured.",
                            type: "error",
                            confirmButtonColor: $UI.COLOURS.brandSecondary
                        });
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

        function TaxTotal(type) {
            if (!$scope.payment.Driver.VATRegistered) {
                return 0;
            } else {
                return ($scope.payment.Bill.BookingsSubTotal + $scope.payment.Bill.WaitingSubTotal) * 0.20;
            }
        }

        function calculateDue(type) {
            if (!$scope.selectedItem)
                return 0;
            var res = 0;

            if (type == 'Invoice') {
                $scope.selectedItem.InvoiceBookings.forEach(function (b) {
                    res = res + b.Total;
                })
            }
            if (type == 'Bill') {
                $scope.selectedItem.BillBookings.forEach(function (b) {
                    res = res + b.Total;
                })
            }
            return res;
        }

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
                angular.forEach($scope.selectedItem.InvoiceBookings, function (b) {
                    if ($scope.allInvoiceSelected)
                        b.$selected = true;
                    else
                        b.$selected = false;
                });
            }
            if (type == 'Bill') {
                $scope.allBillsSelected = !$scope.allBillsSelected;
                angular.forEach($scope.selectedItem.BillBookings, function (b) {
                    if ($scope.allBillsSelected)
                        b.$selected = true;
                    else
                        b.$selected = false;
                });
            }
        }

        function save() {
            var promises = [];
            $scope.payment.Bookings = [];
            $scope.payment.Driver = null;
            $scope.payment.PaymentMethod = null;

            if ($scope.payment.Bill) {
                if (!$scope.payment.Bill.Reference)
                    $scope.payment.Bill.Reference = 'AUTO';

                if ($scope.payment.Bill.Id && Object.keys($scope.payment.Bill.$$changedValues).length > 0) {
                    promises.push($scope.payment.Bill.$patch()); // update bill object
                }
            }
            if ($scope.payment.Invoice) {
                if (!$scope.payment.Invoice.Reference)
                    $scope.payment.Invoice.Reference = 'AUTO';
                if ($scope.payment.Invoice.Id && Object.keys($scope.payment.Invoice.$$changedValues).length > 0) {
                    promises.push($scope.payment.Invoice.$patch(true)); // update invoice object
                }
            }

            //payment bookings
            $scope.InvoiceBookings.forEach(function (ib) {
                if (ib.$selected)
                    $scope.payment.Bookings.push(ib);
            });
            $scope.BillBookings.forEach(function (bb) {
                if (bb.$selected)
                    $scope.payment.Bookings.push(bb);
            });

            promises.push($scope.payment.$patch(true));

            $q.all(promises).then(function () {
                swal({
                    title: "Driver Payment Saved.",
                    text: "Driver Payment has been updated.",
                    type: "success",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
                $state.go($state.current, {
                    Id: $scope.payment.Id
                }, {
                    reload: true
                });
            }, function (err) {
                var msg = null;
                if (err && err.data.Message == "INVALID REFERENCE") {
                    msg = 'Reference already exists!'
                }
                swal({
                    title: "Error Occured",
                    text: msg,
                    type: 'error'
                });
                $state.go($state.current, {
                    Id: $scope.payment.Id
                }, {
                    reload: true
                });
            });
        }

        function cancel() {
            $scope.payment = rDPayment[0];
            createPreviewObject();
            $scope.displayMode = 'VIEW';
        }

        function bookingsInitialise() {
            $scope.InvoiceBookings = [];
            $scope.BillBookings = [];

            $scope.payment.Bookings.forEach(function (b) {
                if (b.PaymentMethod == 'Cash') {
                    $scope.InvoiceBookings.push(b);
                } else if (b.PaymentMethod != 'Cash') {
                    $scope.BillBookings.push(b);
                }
            });
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

        function exportInvoice() {
            $window.open($config.API_ENDPOINT + "api/DriverPayments/pdf?paymentId=" + $scope.payment.Id, '_blank');
        }

        function exportCompanyInvoice() {
            $window.open($config.API_ENDPOINT + "api/DriverPayments/invoicepdf?driverInvoiceId=" + $scope.payment.Invoice.Id, '_blank');
        }

        function recalculate(type) {
            var bookings = [];
            if (type == 'Invoice') {
                bookings = $scope.selectedItem.InvoiceBookings;
            }
            if (type == 'Bill') {
                bookings = $scope.selectedItem.BillBookings;
            }
            var ids = bookings.filter(function (b) {
                return b.$selected;
            }).map(function (b) {
                return b.Booking.Id;
            });
            $http.post($config.API_ENDPOINT + 'api/driverpayments/recalculate', ids).then(function (result) {
                Model.DriverPayment
                    .query()
                    .include('Driver', 'PaymentModel', 'Invoice/Payments', 'Bill/BillPayments', 'Bookings/LeadPassenger, Bookings/BookingStops, Bookings/VehicleType, Bookings/Client')
                    .where('Id', '==', "guid'" + $stateParams.Id + "'")
                    .trackingEnabled()
                    .execute().then(function (response) {
                        $scope.payment = response[0];
                        createPreviewObject();
                    }, function (err) {
                        swal({
                            title: "Some Error Occured.",
                            text: "Some error has occured.",
                            type: "error",
                            confirmButtonColor: $UI.COLOURS.brandSecondary
                        });
                    })
            });
        }


        function removeBookings(type) {
            var bookings = [];
            if (type == 'Invoice') {
                bookings = $scope.selectedItem.InvoiceBookings;
            }
            if (type == 'Bill') {
                bookings = $scope.selectedItem.BillBookings;
            }
            var promises = [];
            angular.forEach(bookings, function (b) {
                if (b.$selected) {
                    promises.push($http.post($config.API_ENDPOINT + 'api/driverpayments/RemoveBooking?bookingId=' + b.Booking.Id));
                }
            });
            $q.all(promises).then(function () {
                window.location.reload();
            });
        }

        function emailTo() {
            $modal.open({
                templateUrl: '/webapp/common/modals/email-to-sent.modal.html',
                controller: ['$scope', 'emailAddress', '$modalInstance', function ($scope, emailAddress, $modalInstance) {
                    if (emailAddress != null)
                        $scope.email = emailAddress;

                    $scope.markSent = true;

                    $scope.sendEmail = function () {
                        $modalInstance.close({
                            email: $scope.email,
                            markSent: $scope.markSent
                        });
                    }
                }],
                resolve: {
                    emailAddress: function () {
                        return $scope.payment.Driver.Email;
                    }
                }
            }).result.then(function (res) {
                if (res.email != null) {
                    //swal('Success', 'User will receive the email soon..', 'success');
                    $http.post($config.API_ENDPOINT + 'api/email', {
                        Type: "DriverPaymentConfirmation",
                        PaymentId: $scope.payment.Id,
                        DriverId: $scope.payment.DriverId,
                        EmailId: res.email
                    }).success(function () {
                        Notification.success('Email Sent');
                        if (res.markSent) {
                            var x = new Model.DriverPayment({
                                Id: $scope.payment.Id
                            });
                            x.Status = 'Unpaid';
                            x.$patch().then(function () {
                                $scope.payment.Status = 'Unpaid';
                            });
                        }
                    })
                }
            });
        }
    }
}())