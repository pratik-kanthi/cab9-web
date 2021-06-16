(function () {
    var module = angular.module('cab9.common');

    module.controller('DriverPaymentModelsController', settingsPaymentModelsController);

    settingsPaymentModelsController.$inject = ['$scope', '$modal', 'rPaymentModels', 'Model'];

    function settingsPaymentModelsController($scope, $modal, rPaymentModels, Model) {
        $scope.paymentModels = rPaymentModels;
        $scope.newPayment = null;
        $scope.selected = null;
        $scope.openPaymentModal = openPaymentModal;
        $scope.selectPaymentModel = selectPaymentModel;
        $scope.deletePaymentModel = deletePaymentModel;
        $scope.updatePaymentModel = updatePaymentModel;

        $scope.viewMode = 'VIEW';

        function openPaymentModal() {
            var modalInstance = $modal.open({
                templateUrl: '/webapp/common/modals/driver-payment-create.modal.html',
                controller: 'DriverPaymentModelCreateController',
                size: 'lg'
            })

            modalInstance.result.then(function (data) {
                $scope.paymentModels.push(data);
            }, function () {

            });
        }

        function selectPaymentModel(pm) {
            $scope.selected = pm;
        }

        function deletePaymentModel(pm) {
            swal({
                    title: "Are you sure?",
                    text: "Payment Model will be deleted",
                    type: "warning",
                    showCancelButton: true,
                    confirmButtonColor: '#DD6B55',
                    confirmButtonText: 'Yes, delete it!',
                    closeOnConfirm: false
                },
                function () {
                    pm.$delete().success(function () {
                        swal("Success", "Payment Model Deleted.", "success");
                        refetch()
                    });
                })
        }

        function updatePaymentModel(pm) {
            if (pm.Name.length > 0) {
                pm.$patch().success(function () {
                    swal("Success", "Payment Model Updated", "success");
                    refetch();
                });

                $scope.selected = null;
            }
        }

        function refetch() {
            Model.DriverPaymentModel
                .query()
                .trackingEnabled()
                .execute()
                .then(function (data) {
                    $scope.paymentModels = data;
                });
        }
    }
}())