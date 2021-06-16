(function() {
    var module = angular.module('cab9.invoices');

    module.controller('InvoiceItemEditController', invoiceItemEditController);

    invoiceItemEditController.$inject = ['$scope', 'rInvoice', 'rPayments', '$filter', 'rTaxes', 'Localisation', '$UI', '$state', '$q', '$parse', 'Model', '$stateParams', '$modal', 'Notification', 'Auth', '$config', '$window', '$http', 'rCompany'];

    function invoiceItemEditController($scope, rInvoice, rPayments, $filter, rTaxes, Localisation, $UI, $state, $q, $parse, Model, $stateParams, $modal, Notification, Auth, $config, $window, $http, rCompany) {
        $scope.invoice = rInvoice[0];
        $scope.invoice.Bookings = [];

        var taxHash = {};
        angular.forEach(rTaxes, function(t) {
            t.$rate = t.TaxComponents.reduce(function(prev, cur) { return prev + (cur.Rate / 100); }, 0);
            taxHash[t.Id] = t.$rate;
        });


        //fetch bookings
        $scope.fetchingBookings = true;
        $http({
            method: 'GET',
            url: $config.API_ENDPOINT + '/api/invoice/bookings?invoiceId=' + $scope.invoice.Id
        }).then(function successCallback(response) {
            
            $scope.invoice.Bookings = response.data;
            $scope.fetchingBookings = false;
        }, function errorCallback(response) {
            $scope.fetchingBookings = false;
        });

        // angular.forEach(rBookings.data, function(b) {
        //     var booking = new Model.Booking(b);
        //     $scope.invoice.Bookings.push(booking);
        //     booking.$ExtrasTax = booking.BookingExpense.reduce(function(prev, cur) { return prev + (cur.Amount * taxHash[cur.TaxId]); }, 0);
        //     booking.$AdjustTax = 0;

        // });

        $scope.invoice.$commit();

        $scope.displayMode = 'VIEW';
        $scope.payments = rPayments;
        $scope.days = [];
        $scope.taxes = rTaxes; //.filter(function (t) { return ((t.TaxType ? t.TaxType.Name == 'Sales' : null) || t.TaxTypeId == null); });
        $scope.currency = ((Localisation.currency().getCurrent() && Localisation.currency().getCurrent().Prepend) || '�');
        $scope.opened = {};
        if (!$scope.invoice.InvoiceDetails)
            $scope.invoice.InvoiceDetails = [];

        $scope.invoice.$dueDate = moment($scope.invoice.DueDate).add(rCompany[0].DefaultInvoiceDueDateOffset || 30, 'days').toDate();


        $scope.accessors = {
            LogoUrl: function(item) {
                return $scope.COMPANY ? $scope.COMPANY._ImageUrl : '';
            }
        }

        var d = new Date();
        $scope.range = {
            From: new moment().subtract(1, 'month').toDate(),
            To: new moment().toDate()
        };

        $scope.saveBookingEdit = saveBookingEdit;
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
        $scope.markAsPaid = markAsPaid;
        $scope.calculatePaidAmount = calculatePaidAmount;
        $scope.exportReceipt = exportReceipt;
        $scope.exportReceiptExcel = exportReceiptExcel;
        $scope.emailTo = emailTo;

        $scope.allSelected = allSelected;
        $scope.anySelected = anySelected;

        $scope.deleteInvoice = deleteInvoice;
        $scope.calculateExtrasCost = calculateExtrasCost;
        $scope.addExtras = addExtras;
        $scope.deleteItem = deleteItem;
        $scope.BExtrasTotal = BExtrasTotal;
        $scope.ExtrasTotal = ExtrasTotal;
        $scope.AdjustmentsTotal = AdjustmentsTotal;
        $scope.BAdjustmentsTotal = BAdjustmentsTotal;
        $scope.WaitingTotal = WaitingTotal;
        $scope.BTaxesTotal = BTaxesTotal;
        $scope.JourneyTotal = JourneyTotal;

        $scope.removeBookings = removeBookings;

        function saveBookingEdit(booking) {
            $http.post($config.API_ENDPOINT + 'api/Invoice/setInvoiceCost', null, {
                params: {
                    bookingId: booking.Id,
                    cost: booking.InvoiceCost
                }
            }).then(function(response) {
                $state.go($state.current.name, $state.current.params, {
                    reload: true
                });
            });
        }

        function removeBookings() {
            var selected = $scope.invoice.Bookings.filter(function(x) { return x.$selected });
            $http.post($config.API_ENDPOINT + 'api/Invoice/removeBookings', selected.map(function(x) { return x.Id; }))
                .then(function() {
                    for (var i = 0; i < selected.length; i++) {
                        var b = selected[i];
                        var index = $scope.invoice.Bookings.indexOf(b);
                        $scope.invoice.Bookings.splice(index, 1);
                    }
                    Model.Invoice
                        .query()
                        .include('Client')
                        .where('Id', '==', "guid'" + $stateParams.Id + "'")
                        .trackingEnabled()
                        .execute().then(function(response) {
                            var invoice = response[0];
                            invoice.Bookings = $scope.invoice.Bookings;
                            $scope.invoice = invoice;
                            if (!$scope.invoice.InvoiceDetails)
                                $scope.invoice.InvoiceDetails = [];
                            $scope.invoice.$commit();
                        });
                    $scope.days = [];
                    orderBookings();
                });
        }

        function orderBookings() {
            $scope.invoice.Bookings = $filter('orderBy')($scope.invoice.Bookings, 'BookedDateTime');
            $scope.invoice.$commit();

            if ($scope.invoice.InvoiceGroupField) {
                var getter = null;
                switch ($scope.invoice.InvoiceGroupField) {
                    case 'Passenger':
                        getter = $parse("LeadPassenger.Firstname + ' ' + LeadPassenger.Surname");
                        break;
                    case 'Booker':
                        getter = $parse("ClientStaff.Firstname + ' ' + ClientStaff.Surname");
                        break;
                    case 'Reference':
                        getter = $parse("Reference");
                        break;
                    default:
                        getter = function(booking) {
                            var found = booking.BookingValidations.filter(function(bv) {
                                return bv.ClientReferenceReferenceName == $scope.invoice.InvoiceGroupField;
                            })[0];
                            if (found) {
                                return found.Value;
                            } else {
                                return 'None';
                            }
                        }
                        break;
                }
                angular.forEach($scope.invoice.Bookings, function(b) {
                    var value = getter(b);
                    var day = $scope.days.filter(function(bd) {
                        return bd.date == $scope.invoice.InvoiceGroupField + ': ' + value;
                    })[0];
                    if (day) {
                        day.bookings.push(b);
                    } else {
                        $scope.days.push({
                            date: $scope.invoice.InvoiceGroupField + ': ' + value,
                            bookings: [b]
                        })
                    }
                });
            } else {
                angular.forEach($scope.invoice.Bookings, function(b) {
                    var date = $filter('companyDate')(new moment(b.BookedDateTime), 'DD/MM/YYYY');
                    var day = $scope.days.filter(function(bd) {
                        return bd.date == date;
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

            angular.forEach($scope.days, function(day) {
                day.InvoiceCost = day.bookings.reduce(function(prev, next) {
                    return prev += next.InvoiceCost;
                }, 0);
                day.WaitingCost = day.bookings.reduce(function(prev, next) {
                    return prev += next.WaitingCost;
                }, 0);
                day.ExtrasCost = day.bookings.reduce(function(prev, next) {
                    return prev += next.ExtrasCost;
                }, 0);
                day.AdjustmentTotal = day.bookings.reduce(function(prev, next) {
                    return prev += next.AdjustmentTotal;
                }, 0);
                day.Discount = day.bookings.reduce(function(prev, next) {
                    return prev += next.Discount;
                }, 0);
                day.TaxAmount = day.bookings.reduce(function(prev, booking) {
                    return prev += (booking.Tax) ? (((booking.AdjustmentTotal + booking.InvoiceCost - booking.Discount + booking.WaitingCost) * booking.Tax._TaxAmount) + booking.$ExtrasTax + booking.$AdjustTax) : 0;
                }, 0);
                day.TotalAmount = day.InvoiceCost + day.AdjustmentTotal - day.Discount + day.TaxAmount + day.ExtrasCost + day.WaitingCost;
            });


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

        function startEditing() {
            $scope.displayMode = 'EDIT';
        }

        function saveEdits() {
            var bookings = angular.copy($scope.invoice.Bookings);
            $scope.invoice.Bookings.length = 0;
            $scope.invoice.$patch(true).success(function(res) {
                $scope.invoice.Bookings = bookings;
                $scope.fetchingBookings = false;
                swal({
                    title: "Invoice Updated.",
                    text: "Invoice has been updated.",
                    type: "success",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
                $scope.displayMode = 'VIEW';
            }).error(function(err) {
                var msg = null;
                $scope.invoice.Bookings = bookings;
                $scope.fetchingBookings = false;
                if (err && err.Message == "INVALID REFERENCE")
                    msg = 'Reference already exists!'
                swal({
                    title: "Error Occured",
                    text: msg,
                    type: 'error'
                });
            });
        }

        function calculatePaidAmount() {
            var res = 0.0;
            angular.forEach($scope.payments, function(p) {
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
            }, function() {
                $scope.invoice.$delete().success(function() {
                    $state.go('root.invoices', null, {
                        reload: true
                    });
                });
            });
        }

        function cancelEditing() {
            $scope.invoice.$rollback(false);
            $scope.displayMode = 'VIEW';
        }

        function fetchBookings() {
            if ($scope.invoice.Bookings.length != savedBookings.length) {
                $scope.invoice.Bookings = [];
                [].push.apply($scope.invoice.Bookings, savedBookings);

                angular.forEach($scope.invoice.Bookings, function(b) {
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
                .execute().then(function(results) {
                    angular.forEach(results, function(booking) {
                        booking.BookingStops = $filter('orderBy')(booking.BookingStops, 'StopOrder');
                        booking.$commit();
                    });
                    [].push.apply($scope.invoice.Bookings, results);
                });
        }

        function setTax(id, item) {
            item.Tax = $scope.taxes.filter(function(t) {
                return t.Id == id;
            })[0];
        }

        function openCalendar(event, name) {
            $scope.opened[name] = true;
            event.preventDefault();
            event.stopPropagation();
        }

        function anySelected() {
            return $scope.invoice.Bookings.some(function(x) { return x.$selected; });
        }

        function allSelected() {
            return $scope.invoice.Bookings.every(function(x) { return x.$selected; });
        }

        function toggleSelectAll() {
            var allSelected = $scope.allSelected();
            angular.forEach($scope.invoice.Bookings, function(b) {
                b.$selected = !allSelected;
            });
        }

        function BookingsTotal() {
            var result = 0;
            var bookings = $scope.getSelectedBookings();
            angular.forEach(bookings, function(booking) {
                result = result + ((booking.InvoiceCost + booking.WaitingCost + booking.ExtrasCost + booking.AdjustmentTotal - booking.Discount) * (1 + booking.Tax._TaxAmount));
            });
            return result;

        }

        function TaxesTotal() {
            var result = 0;
            angular.forEach($scope.getSelectedBookings(), function(b) {
                var cost = 0;
                if (b.Discount == "" || b.Discount == null)
                    cost = (b.Tax) ? ((b.InvoiceCost) * b.Tax._TaxAmount) : 0;
                else
                    cost = (b.Tax) ? ((b.InvoiceCost - b.Discount) * b.Tax._TaxAmount) : 0;
                result = result + cost;
            });
            angular.forEach($scope.invoice.InvoiceDetails, function(i) {
                var cost = 0;
                if (i.UnitPrice && i.Quantity) {
                    cost = (i.Tax) ? ((i.UnitPrice * i.Quantity) * i.Tax._TaxAmount) : 0;
                }
                result = result + cost;
            });
            return result;
        }

        $scope.round = function(val) {
            return Math.round(val * 100) / 100;
        }

        $scope.getSelectedBookings = function() {
            var res = [];
            angular.forEach($scope.invoice.Bookings, function(b) {
                if (b.$selected) {
                    res.push(b);
                }
            });
            return res;
        }

        function logPayments() {
            var modalInstance = $modal.open({
                templateUrl: '/webapp/management/invoicing/invoices/modals/payments-modal.partial.html',
                controller: 'PaymentsModalCtrl',
                size: 'lg',
                windowClass: 'invoice-payment',
                resolve: {
                    rInvoiceSummary: function() {
                        var summary = {
                            InvoiceRef: $scope.invoice.Reference,
                            SubTotal: $scope.invoice.SubTotal - AdjustmentsTotal(),
                            TaxAmount: $scope.invoice.TaxAmount,
                            TotalAmount: $scope.invoice.TotalAmount
                        };
                        return summary;
                    },
                    rInvoice: function() {
                        return $scope.invoice
                    },
                    rPayments: ['Model', function(Model) {
                        return Model.Payment
                            .query()
                            .trackingEnabled()
                            .where('InvoiceId', '==', "guid'" + $stateParams.Id + "'")
                            .execute();
                    }]
                }
            });

            modalInstance.result.then(function() {

                $q.all([promise1, promise2]).then(function() {
                    Notification.success('Invoice Refreshed');
                });

                var promise1 = Model.Payment
                    .query()
                    .where('InvoiceId', '==', "guid'" + $stateParams.Id + "'")
                    .execute().then(function(result) {
                        $scope.payments = result;
                    });

                var promise2 = Model.Invoice
                    .query()
                    .select('Status')
                    .where('Id', '==', "guid'" + $stateParams.Id + "'")
                    .execute().then(function(result) {
                        $scope.invoice.Status = result[0].Status;
                    });

            }, function() {

            });
        }

        function markStatus() {
            $scope.invoice.$patch(true).success(function(res) {});
        }

        function markAsPaid() {
            $http({
                method: 'POST',
                url: $config.API_ENDPOINT + '/api/invoice/markpaid?invoiceId=' + $stateParams.Id
            }).then(function successCallback(response) {
                swal('Success', 'Invoice is marked as paid.', 'success');
                $scope.invoice.Status = 'Paid';
            }, function errorCallback(response) {
                swal('Error', 'There was an error marking the invoice as paid.', 'error');
            });
        }

        function exportReceipt() {
            $window.open($config.API_ENDPOINT + "api/Invoice/pdf?invoiceId=" + $scope.invoice.Id, '_blank');
        }

        function exportReceiptExcel() {
            $window.open($config.API_ENDPOINT + "api/Invoice/excel?invoiceId=" + $scope.invoice.Id, '_blank');
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

        function WaitingTotal() {
            var result = 0;
            var bookings = $scope.getSelectedBookings();
            angular.forEach(bookings, function(i) {
                result = result + i.WaitingCost;
            });
            return result;
        }

        function JourneyTotal() {
            var result = 0;
            var bookings = $scope.getSelectedBookings();
            angular.forEach(bookings, function(i) {
                result = result + i.InvoiceCost;
            });
            return result;
        }

        function ExtrasTotal() {
            var res = 0.00;
            angular.forEach($scope.invoice.InvoiceDetails, function(i) {
                if (i.UnitPrice && i.Quantity) {
                    res = res + (i.UnitPrice * i.Quantity);
                }
            });
            return res;
        }

        function BExtrasTotal() {
            var result = 0;
            var bookings = $scope.getSelectedBookings();
            angular.forEach(bookings, function(i) {
                result = result + i.ExtrasCost;
            });
            return result;
        }

        function BAdjustmentsTotal() {
            var result = 0;
            var bookings = $scope.getSelectedBookings();
            angular.forEach(bookings, function(i) {
                result = result + i.AdjustmentTotal;
            });
            return result;
        }

        function BTaxesTotal() {
            var result = 0;
            var bookings = $scope.getSelectedBookings();
            angular.forEach(bookings, function(booking) {
                result = result + ((booking.InvoiceCost + booking.WaitingCost + booking.ExtrasCost + booking.AdjustmentTotal - booking.Discount) * booking.Tax._TaxAmount);
            });
            return result;
        }

        function AdjustmentsTotal(withoutTax) {
            var res = 0.00;
            angular.forEach($scope.invoice.Adjustments, function(i) {
                var type = (i.ClientAdjustment || i.ClientPricingModelAdjustment).Type;
                if (type == 'Debit') {
                    res = res + i.Amount - (withoutTax ? 0 : i.TaxAmount);
                }
                if (type == 'Credit') {
                    res = res - (i.Amount - (withoutTax ? 0 : i.TaxAmount));
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
