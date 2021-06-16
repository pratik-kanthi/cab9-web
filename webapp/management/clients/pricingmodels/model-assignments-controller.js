(function () {
    var module = angular.module('cab9.clients');

    module.controller('PricingModelAssignmentsController', PricingModelAssignmentsController);

    PricingModelAssignmentsController.$inject = ['$scope', 'rPricingModels', 'rData'];

    function PricingModelAssignmentsController($scope, rPaymentModels, rData) {
        $scope.paymentModels = rPaymentModels;
        $scope.clientTypes = {};

        angular.forEach(rData, function (item) {
            if (!$scope.clientTypes[item.ClientType.Name]) {
                $scope.clientTypes[item.ClientType.Name] = [];
                $scope.clientTypes[item.ClientType.Name].push(item.ClientType);
            }

            $scope.clientTypes[item.ClientType.Name].push(item);
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
            item.PricingModelId = item.CommDefaultId;
        }

        function EditModel(item) {
            item.$selected = true;
            item.CommDefaultId = item.PricingModelId;
        }

        function getCommModel(item) {
            var res = 'Company Default';
            var groupDefault = 'Group Default';
            var comm = null;

            if (item.PricingModelId) {
                comm = $scope.paymentModels.filter(function (p) {
                    return p.Id == item.PricingModelId
                })[0];
                res = comm ? comm.Name : res;
            } else {
                if (item.ClientType && item.ClientType.PricingModelId) {
                    comm = $scope.paymentModels.filter(function (p) {
                        return p.Id == item.ClientType.PricingModelId
                    })[0];
                    res = comm ? groupDefault : res;
                }
            }

            return res;
        }
    }
}())