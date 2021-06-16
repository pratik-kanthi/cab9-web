(function (angular) {
    var module = angular.module('cab9.common');

    module.controller('NewPaymentInitController', newPaymentInitController);
    newPaymentInitController.$inject = ['$scope', '$state', '$UI', '$q', 'Model', '$stateParams', '$modalInstance', 'rDrivers'];

    function newPaymentInitController($scope, $state, $UI, $q, Model, $stateParams, $modalInstance, rDrivers) {
        $scope.drivers = rDrivers;
        $scope.payment = new Model.DriverPayment();
        $scope.payment.PaymentFrom = new moment().subtract(1, 'month').toDate();
        $scope.payment.PaymentTo = new moment().toDate();
        $scope.payment.Driver = null;
        $scope.payment.PaymentModel = null;
        $scope.selected = {
            DriverIds: null
        };
        $scope.opened = {};
        $scope.payment.Bill = new Model.Bill();
        $scope.payment.Bill.DueDate = new moment().add(1, 'month').toDate();

        $scope.payment.Invoice = new Model.Invoice();
        $scope.payment.Invoice.DueDate = new moment().add(1, 'month').toDate();
        $scope.payment.Invoice.InvoiceType = 'Driver';
        $scope.payment.Invoice.PaymentInstructions = $scope.COMPANY.DefaultInvoicePaymentInstructions;
        $scope.openCalendar = openCalendar;
        $scope.selectAllDrivers = selectAllDrivers;

        function openCalendar(event, name) {
            $scope.opened[name] = true;
            event.preventDefault();
            event.stopPropagation();
        }

        function selectAllDrivers() {
            $scope.selected.DriverIds = $scope.drivers.map(function (item) {
                return item.Id
            });
        }
        $scope.proceed = proceed;

        function proceed() {
            $modalInstance.close();
            $state.go('root.driverpayments.create', {
                data: {
                    payment: $scope.payment,
                    driverIds: $scope.selected.DriverIds
                }
            });
        }
    }
}(angular))