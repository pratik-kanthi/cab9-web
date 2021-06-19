(function (angular) {
    var module = angular.module('cab9.common');

    module.controller('DriverPaymentModelCreateController', driverPaymentModelCreateController);

    driverPaymentModelCreateController.$inject = ['$scope', '$UI', '$q', 'Model', '$stateParams', '$modalInstance'];

    function driverPaymentModelCreateController($scope, $UI, $q, Model, $stateParams, $modalInstance) {
        $scope.paymentModel = new Model.DriverPaymentModel();
        $scope.displayMode = 'CREATE';
        $scope.save = save;

        function save() {
            var promises = [];
            promises.push($scope.paymentModel.$save());
            $q.all(promises).then(function (result) {
                swal({
                    title: "Payment Model Saved.",
                    text: "Changes have been updated",
                    type: "success",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
                $modalInstance.close(result[0].data);
            }, function (error) {
                swal({
                    title: "Some Error Occured.",
                    text: "Some error has occured.",
                    type: "error"
                });
            });
        }
    }
}(angular))