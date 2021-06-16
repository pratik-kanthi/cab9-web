(function(angular) {
    var module = angular.module('cab9.common');

    module.controller('ClientItemReferencesController', clientItemReferencesController);

    clientItemReferencesController.$inject = ['$scope', '$stateParams', '$modal', '$rootScope', '$state', '$q', '$config', '$UI', '$http', 'Model', 'rReferences'];

    function clientItemReferencesController($scope, $stateParams, $modal, $rootScope, $state, $q, $config, $UI, $http, Model, rReferences) {
        $scope.references = rReferences;
        $scope.openReferenceCreate = openReferenceCreate;
        $scope.deleteReference = deleteReference;
        $scope.openReferenceEdit = openReferenceEdit;

        function deleteReference(reference) {
            swal({
                title: "Are you sure?",
                text: "Reference will be deleted",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: '#DD6B55',
                confirmButtonText: 'Yes, delete it!',
                closeOnConfirm: false
            }, function() {
                var index = $scope.references.indexOf(reference);
                new Model.ClientReference(reference).$delete().then(function(response) {
                    swal({
                        title: "Client Reference deleted",
                        text: "Changes have been updated.",
                        type: "success",
                        confirmButtonColor: $UI.COLOURS.brandSecondary
                    });
                    fetchReferences();
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

        function openReferenceCreate() {
            var modalInstance = $modal.open({
                templateUrl: '/webapp/common/views/clients/references/modal/modal.html',
                controller: 'ClientItemReferenceCreateController',
            });

            modalInstance.result.then(function(data) {
                fetchReferences();
            });
        }

        function openReferenceEdit(reference) {
            var modalInstance = $modal.open({
                templateUrl: '/webapp/common/views/clients/references/modal/modal.html',
                controller: 'ClientItemReferenceEditController',
                size: 'lg',
                resolve: {
                    rReference: function() {
                        return Model.ClientReference.query().where("Id eq guid'" + reference.Id + "'").trackingEnabled().execute();
                    }
                }
            })

            modalInstance.result.then(function(data) {
                fetchReferences();
            });
        }

        function fetchReferences() {
            Model.ClientReference
                .query()
                .where("ClientId eq guid'" + $stateParams.Id + "'")
                .execute()
                .then(function(data) {
                    $scope.references = data;
                });
        }
    }
}(angular))
