(function () {
    var module = angular.module('cab9.invoices');

    module.controller('InvoiceItemCreateController', invoiceItemCreateController);

    invoiceItemCreateController.$inject = ['$scope', 'Model', 'rClients', '$stateParams', 'rTaxes', '$filter', 'Localisation', '$q', '$UI', '$state', 'Notification', '$http', '$config'];
    function invoiceItemCreateController($scope, Model, rClients, $stateParams, rTaxes, $filter, Localisation, $q, $UI, $state, Notification, $http, $config) {
        if (!$stateParams.data) {
            $state.go('root.invoices');
            return;
        }

        $scope.taxes = rTaxes; //.filter(function (t) { return ((t.TaxType ? t.TaxType.Name == 'Sales' : null) || t.TaxTypeId == null); });
        $scope.opened = {};
        $scope.currency = Localisation.currency().getCurrent().Prepend;
        $scope.invoices = [];
        $scope.selectedClient = null;
        $scope.fetching = true;
        $scope.data = true;
        $scope.clients = rClients;

        var d = new Date();
        $scope.range = {
            From: $stateParams.data.PaymentFrom,
            To: $stateParams.data.PaymentTo,
            ClientIds: $stateParams.data.clientIds
        };

        fetchBookings();
        
        $scope.fetchBookings = fetchBookings;
        $scope.cancelEditing = cancelEditing;
        $scope.setTax = setTax;
        $scope.toggleSelectAll = toggleSelectAll;
        $scope.BookingsTotal = BookingsTotal;
        $scope.TaxesTotal = TaxesTotal;
        $scope.cancelInvoice = cancelInvoice;
        $scope.confirmInvoice = confirmInvoice;

        function fetchBookings() {

            var model = {
                From: $scope.range.From,
                To: $scope.range.To,
                ClientIds: $scope.range.ClientIds
            }

            $http.post($config.API_ENDPOINT + 'api/Invoice/Previews', model)
            .success(function (res) {
                angular.forEach(res, function (info) {
                    var client = $scope.clients.filter(function (c) { return c.Id == info.ClientId })[0];
                    var bookings = [];
                    angular.forEach(info.Bookings, function (booking) {
                        booking = new Model.Booking(booking);
                        booking.BookingStops = $filter('orderBy')(booking.BookingStops, 'StopOrder');
                        booking.$selected = true;
                        booking.$commit();
                        bookings.push(booking);
                    });
                    angular.forEach(info.Adjustments, function (a) {
                        a.$selected = true;
                    });
                    var invoice = new Model.Invoice();
                    invoice.InvoiceSplitValue = info.SplitValue;
                    invoice.InvoiceSplitField = info.SplitField;
                    invoice.InvoiceGroupField = info.GroupField;
                    invoice.Bookings = bookings;
                    invoice.Adjustments = info.Adjustments;
                    invoice.ClientId = info.ClientId;
                    invoice.Client = client;
                    invoice.PaymentInstructions = $scope.COMPANY.DefaultInvoicePaymentInstructions;
                    invoice.$allSelected = true;
                    invoice.$allAdjustmentsSelected = true;

                    invoice.DueDate = new moment(model.To).subtract(12, 'hours').toDate();

                    [].push.apply($scope.invoices, [invoice]);

                });
                $scope.fetching = false;
            })
            .error(function (res) {
                swal("Error", "Something didn't work, please check the details and try again.", "error");
            });

            //angular.forEach($scope.range.ClientIds, function (clientId) {
            //    var client = $scope.clients.filter(function (c) { return c.Id == clientId; })[0];
            //    Model.Booking
            //   .query()
            //   .filter('BookedDateTime', 'ge', "datetimeoffset'" + new moment($scope.range.From).startOf('day').format() + "'")
            //   .filter('BookedDateTime', 'le', "datetimeoffset'" + new moment($scope.range.To).endOf('day').format() + "'")
            //   .filter('BookingStatus', '==', "'Completed'")
            //   .filter('InvoiceId', '==', null)
            //   .filter('ClientId', '==', "guid'" + clientId + "'")
            //   .include('LeadPassenger, BookingStops, Tax/TaxComponents')
            //   .execute().then(function (results) {
            //       if (results.length > 0) {
            //           angular.forEach(results, function (booking) {
            //               booking.BookingStops = $filter('orderBy')(booking.BookingStops, 'StopOrder');
            //               booking.$selected = true;
            //               booking.$commit();
            //           });

            //           var invoice = new Model.Invoice();
            //           invoice.Bookings = results;
            //           invoice.ClientId = clientId;
            //           invoice.Client = client;
            //           invoice.$allSelected = true;

            //           invoice.DueDate = new moment().add(14, 'day').toDate();
            //           [].push.apply($scope.invoices, [invoice]);
            //       }
            //   });
            //});           
        }
        
        function cancelEditing() {
            $state.go('root.invoices');
        }

        function setTax(taxId, booking) {
            var item = $scope.taxes.filter(function (t) { return t.Id == taxId })[0];
            booking.Tax = item;
        }

        function toggleSelectAll(item, type) {
            if (type == 'Bookings') {
                item.$allSelected = !item.$allSelected;
                angular.forEach(item.Bookings, function (b) {
                    if (item.$allSelected)
                        b.$selected = true;
                    else
                        b.$selected = false;
                });
            } else if (type == 'Adjustments') {
                item.$allAdjustmentsSelected = !item.$allAdjustmentsSelected;
                angular.forEach(item.Adjustments, function (b) {
                    if (item.$allAdjustmentsSelected)
                        b.$selected = true;
                    else
                        b.$selected = false;
                });
            }
        }

        function BookingsTotal(item, field) {
            var result = 0;
            angular.forEach($scope.getSelectedBookings(item), function (i) {
                result = result + parseFloat(i[field])
            });
            return result;
        }

        function TaxesTotal(item) {
            var result = 0;
            angular.forEach($scope.getSelectedBookings(item), function (b) {
                var cost = 0;
                cost = (b.InvoiceCost + b.WaitingCost + b.ExtrasCost - b.Discount) * b.Tax._TaxAmount;
                result = result + cost;
            });
            return result;
        }

        function confirmInvoice(item) {
            var inv = angular.copy(item);
            if (inv.ClientId)
                inv.InvoiceType = 'Client';
            if (!inv.Reference)
                inv.Reference = 'AUTO';
            inv.Bookings = $scope.getSelectedBookings(item);
            inv.Adjustments = $scope.getSelectedAdjustments(item);
            inv.$save().success(function (res) {
                Notification.success('Invoice Saved');

                var index = $scope.invoices.indexOf(item);
                $scope.invoices.splice(index, 1);

                if ($scope.invoices.length === 0) {
                    $state.go('root.invoices', null, { reload: true });
                }
            }).error(function (err) {
                var msg = null;
                if (err && err.Message == "INVALID REFERENCE")
                    msg = 'Reference already exists!'
                swal({ title: "Error Occured", text: msg, type: 'error' });
            });
        }

        function cancelInvoice(item) {
            var index = $scope.invoices.indexOf(item);
            $scope.invoices.splice(index, 1);
        }

        $scope.expand = function (item) {
            $scope.selectedClient = item;
        }

        $scope.round = function (val) {
            return Math.round(val * 100) / 100;
        }

        $scope.getSelectedBookings = function (item) {
            var res = [];
            angular.forEach(item.Bookings, function (b) {
                if (b.$selected) {
                    res.push(b);
                }
            });

            return res;
        }

        $scope.getSelectedAdjustments = function (item) {
            var res = [];
            angular.forEach(item.Adjustments, function (b) {
                if (b.$selected) {
                    res.push(b);
                }
            });

            return res;
        }
    }
}())