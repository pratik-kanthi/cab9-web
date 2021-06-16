(function () {
    var module = angular.module('cab9.drivers');

    module.controller('PaymentModelAssignmentsController', PaymentModelAssignmentsController);

    PaymentModelAssignmentsController.$inject = ['$scope', 'rPaymentModels', 'rData'];

    function PaymentModelAssignmentsController($scope, rPaymentModels, rData) {
        $scope.paymentModels = rPaymentModels;
        $scope.driverTypes = {};

        angular.forEach(rData, function (item) {
            if (!$scope.driverTypes[item.DriverType.Name]) {
                $scope.driverTypes[item.DriverType.Name] = [];
                $scope.driverTypes[item.DriverType.Name].push(item.DriverType);
            }

            $scope.driverTypes[item.DriverType.Name].push(item);
        });

        $scope.updateCommModel = updateCommModel;
        $scope.cancelUpdate = cancelUpdate;
        $scope.EditModel = EditModel;
        $scope.getCommModel = getCommModel;

        function updateCommModel(item) {
            item.$patch(true).success(function () {
                item.$selected = false;
            });
        }

        function cancelUpdate(item) {
            item.$selected = false;
            item.DefaultDriverPaymentModelId = item.CommDefaultId;
        }

        function EditModel(item) {
            item.$selected = true;
            item.CommDefaultId = item.DefaultDriverPaymentModelId;
        }

        function getCommModel(item) {
            var res = 'Company Default';
            var groupDefault = 'Group Default';
            var comm = null;

            if (item.DefaultDriverPaymentModelId) {
                comm = $scope.paymentModels.filter(function (p) {
                    return p.Id == item.DefaultDriverPaymentModelId
                })[0];
                res = comm ? comm.Name : res;
            } else {
                if (item.DriverType && item.DriverType.DefaultDriverPaymentModelId) {
                    comm = $scope.paymentModels.filter(function (p) {
                        return p.Id == item.DriverType.DefaultDriverPaymentModelId
                    })[0];
                    res = comm ? groupDefault : res;
                }
            }

            return res;
        }
    }
}())