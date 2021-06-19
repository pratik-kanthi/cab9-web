(function() {
    var module = angular.module('cab9.settings');

    module.controller('ClientPricingModelAdjustmentController', ClientPricingModelAdjustmentController);

    ClientPricingModelAdjustmentController.$inject = ['$scope', '$state', '$stateParams', '$modal', 'rAdjustments', 'Model','$UI'];

    function ClientPricingModelAdjustmentController($scope, $state, $stateParams, $modal, rAdjustments, Model, $UI) {
        $scope.adjustments = rAdjustments;
        $scope.openAdjustmentCreate = openAdjustmentCreate;
        $scope.deleteAdjustment = deleteAdjustment;
        $scope.recurring = true;
        $scope.schema = "ClientPricingModelAdjustment";

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
                function() {
                    new Model.ClientPricingModelAdjustment(adjustment).$delete().then(function(response) {
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
                    }, function(err) {
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
                templateUrl: '/webapp/management/settings/pricingmodels/adjustments/modal/modal.html',
                controller: 'ClientPricingModelAdjustmentCreateController',
                resolve: {
                    rClientId: function() {
                        return $stateParams.Id
                    },
                    rTaxes: function() {
                        return Model.Tax.query().execute();
                    },
                    rVehicleTypes: ['Model', '$stateParams', function(Model, $stateParams) {
                        return Model.VehicleType
                            .query()
                            .select('Id, Name')
                            .execute()
                    }]
                }
            })
            modalInstance.result.then(function(response) {
                $state.go($state.current, $stateParams, {
                    reload: true
                })
            }, function() {

            });
        }
        $scope.openAdjustmentEdit = openAdjustmentEdit;

        function openAdjustmentEdit(adjustment) {
            var index = $scope.adjustments.indexOf(adjustment);
            var modalInstance = $modal.open({
                templateUrl: '/webapp/management/settings/pricingmodels/adjustments/modal/modal.html',
                controller: 'ClientPricingModelAdjustmentEditController',
                resolve: {
                    rAdjustment: function() {
                        return Model.ClientPricingModelAdjustment.query().where("Id eq guid'" + adjustment.Id + "'").trackingEnabled().execute();
                    },
                    rTaxes: function() {
                        return Model.Tax.query().execute();
                    },
                    rVehicleTypes: ['Model', '$stateParams', function(Model, $stateParams) {
                        return Model.VehicleType
                            .query()
                            .select('Id, Name')
                            .execute()
                    }]
                }
            })

            modalInstance.result.then(function(response) {
                $state.go($state.current, $stateParams, {
                    reload: true
                })
            }, function() {});
        }
    }
}())