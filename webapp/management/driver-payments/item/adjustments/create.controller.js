(function () {
    var module = angular.module('cab9.driverpayments');

    module.controller('DriverPaymentsCreateAdjustmentsController', driverPaymentsCreateAdjustmentsController);

    driverPaymentsCreateAdjustmentsController.$inject = ['$scope', '$modal', '$anchorScroll', 'Model', '$http', '$config', '$state', '$q', '$UI'];

    function driverPaymentsCreateAdjustmentsController($scope, $modal, $anchorScroll, Model, $http, $config, $state, $q, $UI) {
        $scope.add = add;
        $scope.toggleAll = toggleAll;
        $scope.allSelected = true;
        $scope.adjustments = $scope.selectedItem.Adjustments;
        $scope.displayMode = "CREATE";
        $scope.openAdjustmentEdit = openAdjustmentEdit;

        function toggleAll() {
            $scope.allSelected = !$scope.allSelected
            $scope.adjustments = $scope.adjustments.map(function (item) {
                item.$selected = $scope.allSelected;
                return item;
            });
        }

        function openAdjustmentEdit(adjustment) {
            var index = $scope.adjustments.indexOf(adjustment);
            var modalInstance = $modal.open({
                templateUrl: '/webapp/common/views/drivers/adjustments/modal/modal.html',
                controller: 'DriverItemAdjustmentEditController',
                size: 'lg',
                resolve: {
                    rAdjustment: function () {
                        return Model.DriverPaymentAdjustment.query().where("Id eq guid'" + adjustment.Id + "'").trackingEnabled().execute();
                    },
                    rTaxes: function () {
                        return Model.Tax.query().execute();
                    }
                }
            })

            modalInstance.result.then(function (response) {
                response.data.$recurring = false;
                $scope.adjustments[index] = response.data;
            }, function () {});
        }

        function add() {
            var modalInstance = $modal.open({
                templateUrl: '/webapp/common/views/drivers/adjustments/modal/modal.html',
                controller: 'DriverItemAdjustmentCreateController',
                resolve: {
                    rDriverId: function () {
                        return $scope.selectedItem.Driver.Id
                    },
                    rTaxes: function () {
                        return Model.Tax.query().execute();
                    }
                }
            })
            modalInstance.result.then(function (response) {
                if (!$scope.adjustments)
                    $scope.adjustments = [];
                response.data.$recurring = false;
                $scope.adjustments.push(response.data);
            }, function () {

            });
        }
    }
})();