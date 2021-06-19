(function () {
    var module = angular.module('cab9.client.invoices');

    module.controller('PaymentsModalCtrl', paymentsModalCtrl);

    paymentsModalCtrl.$inject = ['$scope', 'rInvoiceSummary', 'rPayments', 'Model', '$stateParams'];
    function paymentsModalCtrl($scope, rInvoiceSummary, rPayments, Model, $stateParams) {
        $scope.payments = rPayments;
        $scope.summary = rInvoiceSummary;
        $scope.opened = {};

        $scope.selected = null;
        $scope.openCalendar = openCalendar;
        $scope.calculatePaidAmount = calculatePaidAmount;
        $scope.paymentTypes = null;
        $scope.paymentTypes = new Model.Payment().$$schema.PaymentType.enum;

        function openCalendar(event) {
            event.preventDefault();
            event.stopPropagation();
        }

        function calculatePaidAmount() {
            var res = 0.0;
            angular.forEach($scope.payments, function (p) {
                res = res + parseFloat(p.AmountPaid);
            });
            return res;
        }
    }

}())