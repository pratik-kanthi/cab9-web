(function () {
    var module = angular.module('cab9.common');

    module.controller('DriverItemAdjustmentsController', driverItemAdjustmentsController);

    driverItemAdjustmentsController.$inject = ['$scope', '$UI', '$state', '$stateParams', '$modal', 'rAdjustments', 'Model', 'rRecurring'];

    function driverItemAdjustmentsController($scope, $UI, $state, $stateParams, $modal, rAdjustments, Model, rRecurring) {
        $scope.adjustments = angular.copy(rAdjustments);
        $scope.recurring = false;
        $scope.openAdjustmentCreate = openAdjustmentCreate;
        $scope.deleteAdjustment = deleteAdjustment;
        $scope.recurring = rRecurring;
        $scope.schema = "DriverAdjustment";
        $scope.showFilters = false;
        $scope.filters = {
                Approved: null,
                Type: null,
                Source: null
            }
            //$scope.ApprovedStates=['Approved','UnApproved']
            //    ['Credit','Debit']
        $scope.filterAdjustments = filterAdjustments;

        function filterAdjustments() {
            $scope.adjustments = angular.copy(rAdjustments);
            if ($scope.filters.Approved && $scope.filters.Approved != "") {
                if ($scope.filters.Approved == "Approved")
                    $scope.adjustments = $scope.adjustments.filter(function (item) {
                        return item.Approved
                    })
                if ($scope.filters.Approved == "UnApproved")
                    $scope.adjustments = $scope.adjustments.filter(function (item) {
                        return !item.Approved
                    })

            }
            if ($scope.filters.Type && $scope.filters.Type != "") {
                $scope.adjustments = $scope.adjustments.filter(function (item) {
                    return item.Type == $scope.filters.Type
                })
            }
            //if ($scope.filters.Source && $scope.filters.Source != "") {
            //    $scope.adjustments = $scope.adjustments.filter(function (item) {
            //        return item.FromPaymentModel == ($scope.filters.Source == 'PaymentModel' ? true : false)
            //    })
            //}

        }

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
                    new Model.DriverAdjustment(adjustment).$delete().then(function (response) {
                        swal({
                            title: "Adjustment deleted",
                            text: "Changes have been updated.",
                            type: "success",
                            confirmButtonColor: $UI.COLOURS.brandSecondary
                        });
                        $state.go($state.current, $stateParams, {
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
                templateUrl: '/webapp/common/views/drivers/adjustments/modal/modal.html',
                controller: 'DriverItemAdjustmentCreateController',
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
                templateUrl: '/webapp/common/views/drivers/adjustments/modal/modal.html',
                controller: 'DriverItemAdjustmentEditController',
                size: 'lg',
                resolve: {
                    rAdjustment: function () {
                        return Model.DriverAdjustment.query().where("Id eq guid'" + adjustment.Id + "'").trackingEnabled().execute();
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