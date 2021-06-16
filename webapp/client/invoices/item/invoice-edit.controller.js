(function () {
    var module = angular.module('cab9.client.invoices');

    module.controller('InvoiceItemEditController', invoiceItemEditController);

    invoiceItemEditController.$inject = ['$scope', 'rInvoice', 'rPayments', '$filter', 'rTaxes', 'Localisation', '$UI', '$state', '$q', 'Model', '$stateParams', '$modal', 'Notification', 'Auth', '$config', '$window', '$http'];

    function invoiceItemEditController($scope, rInvoice, rPayments, $filter, rTaxes, Localisation, $UI, $state, $q, Model, $stateParams, $modal, Notification, Auth, $config, $window, $http) {
        $scope.invoice = rInvoice[0];
        $scope.invoice.$commit();
        //Bookings in saved invoice
        var savedBookings = angular.copy($scope.invoice.Bookings);
        $scope.displayMode = 'VIEW';
        $scope.payments = rPayments;
        $scope.days = [];
        $scope.taxes = rTaxes; //.filter(function (t) { return ((t.TaxType ? t.TaxType.Name == 'Sales' : null) || t.TaxTypeId == null); });
        $scope.currency = Localisation.currency().getCurrent().Prepend;
        $scope.opened = {};
        if (!$scope.invoice.InvoiceDetails)
            $scope.invoice.InvoiceDetails = [];

        $scope.accessors = {
            LogoUrl: function (item) {
                return $scope.COMPANY ? $scope.COMPANY._ImageUrl : '';
            }
        }

        var d = new Date();
        $scope.range = {
            From: new moment().subtract(1, 'month').toDate(),
            To: new moment().toDate()
        };

        $scope.startEditing = startEditing;
        $scope.saveEdits = saveEdits;
        $scope.cancelEditing = cancelEditing;
        $scope.fetchBookings = fetchBookings;
        $scope.setTax = setTax;
        $scope.openCalendar = openCalendar;
        $scope.toggleSelectAll = toggleSelectAll;
        $scope.BookingsTotal = BookingsTotal;
        $scope.TaxesTotal = TaxesTotal;
        orderBookings();
        $scope.logPayments = logPayments;
        $scope.markStatus = markStatus;
        $scope.calculatePaidAmount = calculatePaidAmount;
        $scope.exportReceipt = exportReceipt;
        $scope.exportReceiptExcel = exportReceiptExcel;
        $scope.emailTo = emailTo;

        $scope.deleteInvoice = deleteInvoice;
        $scope.calculateExtrasCost = calculateExtrasCost;
        $scope.addExtras = addExtras;
        $scope.deleteItem = deleteItem;
        $scope.ExtrasTotal = ExtrasTotal;

        function orderBookings() {
            angular.forEach($scope.invoice.Bookings, function (b) {
                var date = new moment(b.BookedDateTime).startOf('day');
                var day = $scope.days.filter(function (bd) {
                    return bd.date.isSame(date, 'day');
                })[0];
                if (day) {
                    day.bookings.push(b);
                } else {
                    $scope.days.push({
                        date: date,
                        bookings: [b]
                    })
                }
            });
        }

        function startEditing() {
            if ($scope.invoice.Bookings.length != savedBookings.length) {
                $scope.invoice.Bookings = [];
                [].push.apply($scope.invoice.Bookings, savedBookings);
            }
            angular.forEach($scope.invoice.Bookings, function (b) {
                b.$selected = true;
            });
            $scope.allSelected = true;
            $scope.displayMode = 'EDIT';
        }

        function saveEdits() {
            var promises = [];
            var err = validateExtras();
            if (err != null) {
                swal({
                    title: "Error",
                    text: err,
                    type: 'error'
                });
            } else {

                if ($scope.invoice.InvoiceType != 'Client')
                    $scope.invoice.InvoiceType = 'Client';
                if (!$scope.invoice.Reference)
                    $scope.invoice.Reference = 'AUTO';
                $scope.invoice.Bookings = $scope.getSelectedBookings();
                $scope.invoice.InvoiceDetails = $scope.invoice.InvoiceDetails;
                $scope.invoice.$patch(true).success(function (res) {
                    swal({
                        title: "Invoice Updated.",
                        text: "Invoice has been updated.",
                        type: "success",
                        confirmButtonColor: $UI.COLOURS.brandSecondary
                    });
                    $state.go('root.invoices', null, {
                        reload: true
                    });
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
            }
        }

        function calculatePaidAmount() {
            var res = 0.0;
            angular.forEach($scope.payments, function (p) {
                res = res + parseFloat(p.AmountPaid);
            });
            return res;
        }

        function deleteInvoice() {
            swal({
                title: "Are you sure?",
                text: "This invoice will be deleted permanentaly",
                type: "warning",
                showCancelButton: true,
                confirmButtonText: "Yes, delete it!",
                closeOnConfirm: true
            }, function () {
                $scope.invoice.$delete().success(function () {
                    $state.go('root.invoices', null, {
                        reload: true
                    });
                });
            });
        }

        function cancelEditing() {
            $scope.invoice.$rollback(false);
            angular.forEach($scope.invoice.Bookings, function (b) {
                b.$rollback(false);
            })
            $scope.invoice.Bookings = rInvoice[0].Bookings;
            $scope.displayMode = 'VIEW';
        }

        function fetchBookings() {
            if ($scope.invoice.Bookings.length != savedBookings.length) {
                $scope.invoice.Bookings = [];
                [].push.apply($scope.invoice.Bookings, savedBookings);

                angular.forEach($scope.invoice.Bookings, function (b) {
                    b.$selected = true;
                });
            }
            Model.Booking
                .query()
                .filter('BookedDateTime', 'ge', "datetimeoffset'" + new moment($scope.range.From).startOf('day').format() + "'")
                .filter('BookedDateTime', 'le', "datetimeoffset'" + new moment($scope.range.To).endOf('day').format() + "'")
                .filter('BookingStatus', '==', "'Completed'")
                .filter('InvoiceId', '==', null)
                .filter('ClientId', '==', "guid'" + $scope.invoice.ClientId + "'")
                .include('LeadPassenger, BookingStops, Tax/TaxComponents')
                .orderBy('BookedDateTime')
                .execute().then(function (results) {
                    angular.forEach(results, function (booking) {
                        booking.BookingStops = $filter('orderBy')(booking.BookingStops, 'StopOrder');
                        booking.$commit();
                    });
                    [].push.apply($scope.invoice.Bookings, results);
                });
        }

        function setTax(id, item) {
            item.Tax = $scope.taxes.filter(function (t) {
                return t.Id == id;
            })[0];
        }

        function openCalendar(event, name) {
            $scope.opened[name] = true;
            event.preventDefault();
            event.stopPropagation();
        }

        function toggleSelectAll() {
            $scope.allSelected = !$scope.allSelected;
            angular.forEach($scope.invoice.Bookings, function (b) {
                if ($scope.allSelected)
                    b.$selected = true;
                else
                    b.$selected = false;
            });
        }

        function BookingsTotal() {
            var result = 0;
            var bookings = $scope.getSelectedBookings();
            angular.forEach(bookings, function (i) {
                if (i.Discount == "" || i.Discount == null)
                    result = result + parseFloat(i.InvoiceCost)
                else
                    result = result + parseFloat(i.InvoiceCost) - parseFloat(i.Discount);
            });
            return result;
        }

        function TaxesTotal() {
            var result = 0;
            angular.forEach($scope.getSelectedBookings(), function (b) {
                var cost = 0;
                if (b.Discount == "" || b.Discount == null)
                    cost = (b.Tax) ? ((b.InvoiceCost) * b.Tax._TaxAmount) : 0;
                else
                    cost = (b.Tax) ? ((b.InvoiceCost - b.Discount) * b.Tax._TaxAmount) : 0;
                result = result + cost;
            });
            angular.forEach($scope.invoice.InvoiceDetails, function (i) {
                var cost = 0;
                if (i.UnitPrice && i.Quantity) {
                    cost = (i.Tax) ? ((i.UnitPrice * i.Quantity) * i.Tax._TaxAmount) : 0;
                }
                result = result + cost;
            });
            return result;
        }

        $scope.round = function (val) {
            return Math.round(val * 100) / 100;
        }

        $scope.getSelectedBookings = function () {
            var res = [];
            angular.forEach($scope.invoice.Bookings, function (b) {
                if (b.$selected) {
                    res.push(b);
                }
            });
            return res;
        }

        function logPayments() {
            var modalInstance = $modal.open({
                templateUrl: '/webapp/client/invoices/modals/payments-modal.partial.html',
                controller: 'PaymentsModalCtrl',
                size: 'lg',
                resolve: {
                    rInvoiceSummary: function () {
                        var summary = {
                            InvoiceRef: $scope.invoice.Reference,
                            SubTotal: $scope.invoice.SubTotal,
                            TaxAmount: $scope.invoice.TaxAmount,
                            TotalAmount: $scope.invoice.TotalAmount
                        };
                        return summary;
                    },
                    rPayments: ['Model', function (Model) {
                        return Model.Payment
                            .query()
                            .trackingEnabled()
                            .where('InvoiceId', '==', "guid'" + $stateParams.Id + "'")
                            .execute();
                    }]
                }
            });

            modalInstance.result.then(function () {

                $q.all([promise1, promise2]).then(function () {
                    Notification.success('Invoice Refreshed');
                });

                var promise1 = Model.Payment
                    .query()
                    .where('InvoiceId', '==', "guid'" + $stateParams.Id + "'")
                    .execute().then(function (result) {
                        $scope.payments = result;
                    });

                var promise2 = Model.Invoice
                    .query()
                    .select('Status')
                    .where('Id', '==', "guid'" + $stateParams.Id + "'")
                    .execute().then(function (result) {
                        $scope.invoice.Status = result[0].Status;
                    });

            }, function () {

            });
        }

        function markStatus() {
            $scope.invoice.$patch(true).success(function (res) {});
        }

        function exportReceipt() {
            $window.open($config.API_ENDPOINT + "api/Invoice/pdf?invoiceId=" + $scope.invoice.Id, '_blank');
        }

        function exportReceiptExcel() {
            $window.open($config.API_ENDPOINT + "api/Invoice/excel?invoiceId=" + $scope.invoice.Id, '_blank');
        }

        function emailTo() {
            $modal.open({
                templateUrl: '/webapp/common/modals/email-to-sent.modal.html',
                controller: ['$scope', 'emailAddress', '$modalInstance', function($scope, emailAddress, $modalInstance) {
                    if (emailAddress != null)
                        $scope.email = emailAddress;

                    $scope.markSent = true;

                    $scope.sendEmail = function() {
                        $modalInstance.close({
                            email: $scope.email,
                            markSent: $scope.markSent
                        });
                    }
                }],
                resolve: {
                    emailAddress: function() {
                        return $scope.invoice.Client.BillingEmail || $scope.invoice.Client.Email;
                    }
                }
            }).result.then(function(res) {
                if (res.email != null) {
                    //swal('Success', 'User will receive the email soon..', 'success');

                    $http.post($config.API_ENDPOINT + 'api/email', {
                        Type: "ClientInvoiceConfirmation",
                        InvoiceId: $scope.invoice.Id,
                        ClientId: $scope.invoice.ClientId,
                        EmailId: res.email
                    }).success(function() {
                        var sendable = new Model.Invoice({ Id: $scope.invoice.Id, Status: 'Something' });
                        Notification.success('Email Sent');
                        if (res.markSent) {
                            sendable.Status = 'Sent';
                            sendable.$patch();
                        }
                    })
                }
            });
        }

        function calculateExtrasCost(item) {
            var res = 0.00;
            var total = 0;
            if (item.UnitPrice && item.Quantity) {
                total = item.UnitPrice * item.Quantity; // discount isnt included
                res = total + (item.Tax ? item.Tax._TaxAmount * total : 0);
            }
            return res;
        }

        function addExtras() {
            $scope.newItem = new Model.InvoiceDetail();
            $scope.newItem.Quantity = 1;
            $scope.newItem.UnitPrice = 0;
            $scope.newItem.InvoiceId = $scope.invoice.Id;
            $scope.invoice.InvoiceDetails.push($scope.newItem);
        }

        function deleteItem(item) {
            var index = $scope.invoice.InvoiceDetails.indexOf(item);
            $scope.invoice.InvoiceDetails.splice(index, 1);
        }

        function ExtrasTotal() {
            var res = 0.00;
            angular.forEach($scope.invoice.InvoiceDetails, function (i) {
                if (i.UnitPrice && i.Quantity) {
                    res = res + (i.UnitPrice * i.Quantity);
                }
            });
            return res;
        }

        function validateExtras() {
            var err = '';

            if ($scope.invoice.InvoiceDetails.length > 0) {
                for (var i = 0; i < $scope.invoice.InvoiceDetails.length; i++) {
                    if (!$scope.invoice.InvoiceDetails[i].ItemName) return "Please enter name for extra # " + (i + 1);
                    if (!($scope.invoice.InvoiceDetails[i].UnitPrice >= 0)) return "Please enter price for extra # " + (i + 1);
                    if (!($scope.invoice.InvoiceDetails[i].Quantity > 0)) return "Please enter quantity for extra # " + (i + 1);
                    if (!$scope.invoice.InvoiceDetails[i].TaxId) return "Select VAT rate for extra # " + (i + 1);
                }
            }

            return null;
        }
    }
}())