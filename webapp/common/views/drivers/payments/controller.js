(function () {
    var module = angular.module('cab9.common');

    module.controller('DriverPaymentsController', driverPaymentsController);

    driverPaymentsController.$inject = ['$scope', '$stateParams', '$modal', 'Model', '$state', '$timeout', '$http', '$config', '$UI', 'CSV'];

    function driverPaymentsController($scope, $stateParams, $modal, Model, $state, $timeout, $http, $config, $UI, CSV) {
        $scope.payments = [];
        //        $scope.openPaymentModal = openPaymentModal;
        $scope.start = new moment().subtract(4, 'year');
        $scope.end = new moment().endOf("month");
        $scope.searchTerm = {};
        $scope.hideOptions = true;
        $scope.paging = {
            currentPage: 1,
            totalItems: 0,
            maxPerPage: 100
        };
        var debounce = null;
        $scope.selected = {
            from: new moment().startOf('day'),
            to: new moment().endOf('day'),
            span: 'day'
        };

        $scope.$watch('selected', function (newvalue, oldvalue) {
            if (newvalue && oldvalue) {
                if (debounce) {
                    $timeout.cancel(debounce);
                }
                debounce = $timeout(function () {
                    Model.DriverPayment.query()
                        .include('Driver')
                        .include('PaymentModel')
                        .include('Invoice')
                        .include('Bill')
                        .filter('DriverId', 'eq', "guid'" + $stateParams.Id + "'")
                        .filter('CreationTime', 'ge', "datetimeoffset'" + $scope.selected.from.format() + "'")
                        .filter('CreationTime', 'le', "datetimeoffset'" + $scope.selected.to.format() + "'")
                        .execute().then(function (data) {
                            $scope.payments = data;
                            debounce = null;
                        })
                }, 250);
            }
        }, true)

        $scope.viewItem = function ($row) {
            $state.go('root.driverpayments.viewer.summary', {
                Id: $row.Id
            });
        }
    }
}())