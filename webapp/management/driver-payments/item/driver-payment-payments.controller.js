(function () {
    var module = angular.module('cab9.driverpayments');

    module.controller('DriverPaymentPaymentsController', DriverPaymentPaymentsController);

    DriverPaymentPaymentsController.$inject = ['$scope', '$q', 'Model', 'rDInvoicePayments', 'rBillPayments', '$http', 'rDriverId', '$config'];

    function DriverPaymentPaymentsController($scope, $q, Model, rDInvoicePayments, rBillPayments, $http, rDriverId, $config) {
        $scope.invoicePayments = rDInvoicePayments;
        $scope.billPayments = rBillPayments;
        $scope.driverId = rDriverId;

        $scope.CARD_PAYMENTS_ENABLED = $config.CARD_PAYMENTS_ENABLED;
        $scope.opened = {};
        $scope.openedDt = {};
        $scope.paymentParams = {};

        $scope.InSelected = null;
        $scope.BillSelected = null;

        $scope.newInPayment = null;
        $scope.newBillPayment = null;
        $scope.clientCards = null;

        $scope.selectPayment = selectPayment;
        $scope.updatePayment = updatePayment;
        $scope.cancelUpdate = cancelUpdate;
        $scope.deletePayment = deletePayment;
        $scope.createNewPayment = createNewPayment;
        $scope.cancelSave = cancelSave;
        $scope.TaxTotal = TaxTotal;
        $scope.savePayment = savePayment;
        $scope.openCalendar = openCalendar;
        $scope.calculatePaidAmount = calculatePaidAmount;
        $scope.InPaymentTypes = new Model.Payment().$$schema.PaymentType.enum;
        $scope.BillPaymentTypes = new Model.BillPayment().$$schema.PaymentType.enum;
        $scope.transferBalance = transferBalance;
        $scope.createNewCreditCardPayment = createNewCreditCardPayment;
        $scope.takeInvoiceCardPayment = takeInvoiceCardPayment;
        $scope.cancelNewCardPayment = cancelNewCardPayment;

        function TaxTotal(type) {
            if (!$scope.payment.Driver.VATRegistered) {
                return 0;
            } else {
                return ($scope.payment.Bill.BookingsSubTotal + $scope.payment.Bill.WaitingSubTotal) * 0.20;
            }
        }

        function createNewCreditCardPayment() {
            $scope.fetchingDriverCards = true;
            $scope.cardPaymentForm = true;

            $http.get($config.API_ENDPOINT + 'api/Payments/getcardsfordriver?driverId=' + $scope.driverId)
                .then(function (response) {
                    $scope.fetchingDriverCards = false;
                    $scope.driverCards = response.data;
                });
        }

        function cancelNewCardPayment() {
            $scope.cardPaymentForm = false;
        }

        function takeInvoiceCardPayment() {
            $scope.paymentParams.collectingPayment = true;
            if ($scope.paymentParams.PaymentCard && $scope.paymentParams.Amount > 0) {
                $http({
                    method: 'POST',
                    url: $config.API_ENDPOINT + 'api/Invoice/TakePayment?invoiceId=' + $scope.payment.InvoiceId + '&paymentCardId=' + $scope.paymentParams.PaymentCard.Id + '&amount=' + $scope.paymentParams.Amount
                }).then(function successCallback(response) {
                    swal("Payment Successful", "Payment has been taken successfully using the selected card.", "success");
                    $scope.cardPaymentForm = false;
                    refetch('Invoice');
                    refetch('Bill');
                    $scope.paymentParams.collectingPayment = false;
                    $scope.paymentParams = {};
                }, function errorCallback(response) {
                    swal("Payment Error", "An error occurred while collecting payment. " + response.data.Message, "error");
                    $scope.paymentParams.collectingPayment = false;
                });

            } else {
                swal("Payment Error", "Please make sure that a card is selected and payment amount is more than £0.00.", "error");
                $scope.paymentParams.collectingPayment = false;
            }
        }

        function transferBalance() {
            var invoiceAmount = $scope.payment.Invoice.TotalAmount - calculatePaidAmount('Invoice');
            var billAmount = $scope.payment.Bill.TotalAmount + (($scope.payment.BonusAmount) ? $scope.payment.BonusAmount : 0) - calculatePaidAmount('Bill');

            if (invoiceAmount == billAmount) {
                return;
            }

            var invoicePayment = new Model.Payment();
            invoicePayment.InvoiceId = $scope.payment.InvoiceId;
            invoicePayment.PaymentDate = new moment().format();
            invoicePayment.PaymentType = 'Other';
            invoicePayment.Reference = 'Balance Transfer';

            var billPayment = new Model.BillPayment();
            billPayment.BillId = $scope.payment.BillId;
            billPayment.PaymentDate = new moment().format();
            billPayment.PaymentType = 'Other';
            billPayment.Reference = 'Balance Transfer';

            if (invoiceAmount > billAmount) {
                invoicePayment.AmountPaid = billAmount;
                billPayment.Amount = billAmount;
            } else {
                invoicePayment.AmountPaid = invoiceAmount;
                billPayment.Amount = invoiceAmount;
            }

            billPayment.$save().then(function () {
                invoicePayment.$save().then(function () {
                    refetch('Invoice');
                    refetch('Bill');
                });
            });
        }

        function createNewPayment(type) {
            if (type == 'Invoice') {
                $scope.newInPayment = new Model.Payment();
                $scope.newInPayment.InvoiceId = $scope.payment.InvoiceId;

            }
            if (type == 'Bill') {
                $scope.newBillPayment = new Model.BillPayment();
                $scope.newBillPayment.BillId = $scope.payment.BillId;
            }
        }

        function selectPayment(type, payment) {
            if (type == 'Invoice')
                $scope.InSelected = payment;
            if (type == 'Bill')
                $scope.BillSelected = payment;
        }

        function updatePayment(type, payment) {
            if (type == 'Invoice') {
                if (payment.PaymentDate && payment.AmountPaid > 0 && payment.PaymentType) {
                    payment.$patch().success(function () {
                        swal("Success", "Payment Updated", "success");
                        refetch(type);
                    });
                    $scope.selected = null;
                }
            }
            if (type == 'Bill') {
                if (payment.PaymentDate && payment.Amount > 0 && payment.PaymentType) {
                    payment.$patch().success(function () {
                        swal("Success", "Payment Updated", "success");
                        refetch();
                    });
                    $scope.selected = null;
                }
            }
        }

        function savePayment(type) {
            if (type == 'Invoice') {
                if ($scope.newInPayment.PaymentDate && $scope.newInPayment.AmountPaid > 0 && $scope.newInPayment.PaymentType) {
                    $scope.newInPayment.$save().success(function () {
                        swal("Success", "Invoice Payment Saved.", "success");
                        $scope.newInPayment = null;
                        refetch(type);
                    }).error(function () {
                        swal({
                            title: "Error Occured",
                            type: 'error'
                        });
                    });
                }
            }
            if (type == 'Bill') {
                if ($scope.newBillPayment.PaymentDate && $scope.newBillPayment.Amount > 0 && $scope.newBillPayment.PaymentType) {
                    $scope.newBillPayment.$save().success(function () {
                        swal("Success", "Bill Payment Saved.", "success");
                        $scope.newBillPayment = null;
                        refetch(type);
                    }).error(function () {
                        swal({
                            title: "Error Occured",
                            type: 'error'
                        });
                    });
                }
            }
        }

        function cancelUpdate(type, payment) {
            payment.$rollback();
            if (type == 'Invoice')
                $scope.InSelected = null;
            if (type == 'Bill')
                $scope.BillSelected = null;
        }

        function cancelSave(type) {
            if (type == 'Invoice')
                $scope.newInPayment = null;
            if (type == 'Bill')
                $scope.newBillPayment = null;
        }

        function deletePayment(type, payment) {
            swal({
                title: "Are you sure?",
                text: "This invoice will be deleted permanentaly",
                type: "warning",
                showCancelButton: true,
                confirmButtonText: "Yes, delete it!",
                closeOnConfirm: true
            }, function () {
                payment.$delete().success(function () {
                    refetch(type)
                });
            });
        }

        function refetch(type) {
            if (type == 'Invoice') {
                Model.Payment
                    .query()
                    .where('InvoiceId', '==', "guid'" + $scope.payment.InvoiceId + "'")
                    .trackingEnabled()
                    .execute()
                    .then(function (data) {
                        $scope.invoicePayments = data;
                    });
            }

            if (type == 'Bill') {
                Model.BillPayment
                    .query()
                    .where('BillId', '==', "guid'" + $scope.payment.BillId + "'")
                    .trackingEnabled()
                    .execute()
                    .then(function (data) {
                        $scope.billPayments = data;
                    });
            }
        }

        function openCalendar(event) {
            event.preventDefault();
            event.stopPropagation();
        }

        function calculatePaidAmount(type) {
            var res = 0.0;
            if (type == 'Invoice') {
                angular.forEach($scope.invoicePayments, function (p) {
                    res = res + parseFloat(p.AmountPaid);
                });
            }
            if (type == 'Bill') {
                angular.forEach($scope.billPayments, function (p) {
                    res = res + parseFloat(p.Amount);
                });
            }
            return res;
        }
    }
}())