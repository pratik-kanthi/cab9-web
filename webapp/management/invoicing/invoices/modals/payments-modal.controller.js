(function() {
    var module = angular.module('cab9.invoices');

    module.controller('PaymentsModalCtrl', paymentsModalCtrl);

    paymentsModalCtrl.$inject = ['$scope', 'rInvoiceSummary', 'rPayments', 'rInvoice', '$http', 'Model', '$stateParams', '$modal', '$config'];

    function paymentsModalCtrl($scope, rInvoiceSummary, rPayments, rInvoice, $http, Model, $stateParams, $modal, $config) {
        $scope.payments = rPayments;
        $scope.summary = rInvoiceSummary;
        $scope.invoice = rInvoice;
        $scope.opened = {};
        $scope.CARD_PAYMENTS_ENABLED = $config.CARD_PAYMENTS_ENABLED;

        $scope.selected = null;
        $scope.newPayment = null;
        $scope.clientCards = null;
        $scope.paymentParams = {};

        $scope.checkPaymentValidity = checkPaymentValidity;
        $scope.selectPayment = selectPayment;
        $scope.updatePayment = updatePayment;
        $scope.cancelUpdate = cancelUpdate;
        $scope.deletePayment = deletePayment;
        $scope.createNewPayment = createNewPayment;

        $scope.createNewCreditCardPayment = createNewCreditCardPayment;
        $scope.cancelNewCardPayment = cancelNewCardPayment;
        $scope.takeInvoiceCardPayment = takeInvoiceCardPayment;

        $scope.cancelSave = cancelSave;
        $scope.savePayment = savePayment;
        $scope.openCalendar = openCalendar;
        $scope.calculatePaidAmount = calculatePaidAmount;
        $scope.paymentTypes = null;
        $scope.paymentTypes = new Model.Payment().$$schema.PaymentType.enum;

        function createNewPayment() {
            $scope.newPayment = new Model.Payment();
            $scope.newPayment.InvoiceId = $stateParams.Id;
        }

        function selectPayment(payment) {
            if (payment.TransactionId) {
                swal("Edit Not Authorised", "This payment is linked to a card transaction and cannot be edited.", "error");
            } else {
                $scope.selected = payment;
            }
        }

        function checkPaymentValidity(payment, newPaymentAmount) {
            var totalAmount = parseFloat($scope.invoice.TotalAmount.toFixed(2));
            return (totalAmount - $scope.calculatePaidAmount() - newPaymentAmount < 0) || (!payment.PaymentDate || !payment.Reference || !payment.AmountPaid || payment.AmountPaid <= 0 || !payment.PaymentType)
        }

        function createNewCreditCardPayment() {
            $scope.fetchingClientCards = true;
            $scope.cardPaymentForm = true;

            Model.PaymentCard
                .query()
                .where("ClientId eq guid'" + $scope.invoice.ClientId + "'")
                .where("Active eq true")
                .execute()
                .then(function(data) {
                    $scope.fetchingClientCards = false;
                    $scope.clientCards = data;
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
                    url: $config.API_ENDPOINT + 'api/Invoice/TakePayment?invoiceId=' + $scope.invoice.Id + '&paymentCardId=' + $scope.paymentParams.PaymentCard.Id + '&amount=' + $scope.paymentParams.Amount
                }).then(function successCallback(response) {
                    swal("Payment Successful", "Payment has been taken successfully using the selected card.", "success");
                    $scope.cardPaymentForm = false;
                    refetch();
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

        function updatePayment(payment) {
            if (payment.TransactionId) {
                swal("Edit Not Authorised", "This payment is linked to a card transaction and cannot be edited.", "error");
            } else {
                if (payment.PaymentDate && payment.AmountPaid > 0 && payment.PaymentType) {
                    payment.$patch().success(function() {
                        swal("Success", "Payment Updated", "success");
                        refetch();
                    });
                    $scope.selected = null;
                }
            }
        }

        function savePayment() {

            if ($scope.newPayment.PaymentDate && $scope.newPayment.AmountPaid > 0 && $scope.newPayment.PaymentType) {
                $scope.newPayment.$save().success(function() {
                    $scope.newPayment = null;
                    refetch();
                }).error(function() {
                    swal({ title: "Error Occured", type: 'error' });
                });
            }
        }

        function cancelUpdate(payment) {
            payment.$rollback();
            $scope.selected = null;
        }

        function cancelSave() {
            $scope.newPayment = null
        }

        function deletePayment(payment) {
            swal({
                title: "Are you sure?",
                text: "This payment will be deleted permanentaly",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: "Yes, delete it!",
                closeOnConfirm: false
            }, function() {
                if (payment.TransactionId) {
                    swal("Deletion Not Authorised", "This payment is linked to a card transaction and cannot be deleted.", "error");
                } else {
                    payment.$delete().success(refetch);
                    swal("Deleted", "This payment has been deleted.", "success");
                }
            });
        }

        function refetch() {
            Model.Payment
                .query()
                .where('InvoiceId', '==', "guid'" + $stateParams.Id + "'")
                .execute()
                .then(function(data) {
                    $scope.payments = data;
                });
        }

        function openCalendar(event) {
            event.preventDefault();
            event.stopPropagation();
        }

        function calculatePaidAmount() {
            var res = 0.0;
            angular.forEach($scope.payments, function(p) {
                res = res + parseFloat(p.AmountPaid);
            });
            return res;
        }
    }

}())
