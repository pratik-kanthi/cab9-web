(function () {
    var module = angular.module('cab9.settings');

    module.controller('DriverPaymentModelAdjustmentController', driverPaymentModelAdjustmentController);

    driverPaymentModelAdjustmentController.$inject = ['$scope', '$state', '$stateParams', '$modal', 'rAdjustments', 'Model'];

    function driverPaymentModelAdjustmentController($scope, $state, $stateParams, $modal, rAdjustments, Model) {
        $scope.adjustments = rAdjustments;
        $scope.openAdjustmentCreate = openAdjustmentCreate;
        $scope.deleteAdjustment = deleteAdjustment;
        $scope.recurring = true;
        $scope.schema = "DriverPaymentModelAdjustment";

        function deleteAdjustment(adjustment) {
            swal({
                    title: "Are you sure?",
                    text: "Adjustment will be deleted",
                    type: "warning",
                    showCancelButton: true,
                    confirmButtonColor: '#DD6B55',
                    confirmButtonText: 'Yes, delete it!',
                    closeOnConfirm: false
                },
                function () {
                    new Model.DriverPaymentModelAdjustment(adjustment).$delete().then(function (response) {
                        swal({
                            title: "Adjustment deleted",
                            text: "Changes have been updated.",
                            type: "success",
                            confirmButtonColor: $UI.COLOURS.brandSecondary
                        });
                        $state.go($state.current, {
                            Id: $stateParams.Id
                        }, {
                            reload: true
                        });
                    }, function (err) {
                        swal({
                            title: "Some Error Occured.",
                            text: "Some error has occured.",
                            type: "error",
                            confirmButtonColor: $UI.COLOURS.brandSecondary
                        });
                    })
                })
        }

        function openAdjustmentCreate() {
            var modalInstance = $modal.open({
                templateUrl: '/webapp/management/settings/driverpayments/adjustments/modal/modal.html',
                controller: 'DriverPaymentModelAdjustmentCreateController',
                resolve: {
                    rDriverId: function () {
                        return $stateParams.Id
                    },
                    rTaxes: function () {
                        return Model.Tax.query().execute();
                    },
                    rVehicleTypes: function() {
                        return Model.VehicleType.query().select("Id, Name").execute()
                    }
                }
            })
            modalInstance.result.then(function (response) {
                //                $scope.adjustments.push(response.data);
                $state.go($state.current, $stateParams, {
                    reload: true
                })
            }, function () {

            });
        }
        $scope.openAdjustmentEdit = openAdjustmentEdit;

        function openAdjustmentEdit(adjustment) {
            var index = $scope.adjustments.indexOf(adjustment);
            var modalInstance = $modal.open({
                templateUrl: '/webapp/management/settings/driverpayments/adjustments/modal/modal.html',
                controller: 'DriverPaymentModelAdjustmentEditController',
                resolve: {
                    rAdjustment: function () {
                        return Model.DriverPaymentModelAdjustment.query().where("Id eq guid'" + adjustment.Id + "'").trackingEnabled().execute();
                    },
                    rTaxes: function () {
                        return Model.Tax.query().execute();
                    },
                    rVehicleTypes: function() {
                        return Model.VehicleType.query().select("Id, Name").execute()
                    }
                }
            })

            modalInstance.result.then(function (response) {
                //                $scope.adjustments[index] = response.data;
                $state.go($state.current, $stateParams, {
                    reload: true
                })
            }, function () {});
        }
    }
}())