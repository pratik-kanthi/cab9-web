(function (angular) {
    var module = angular.module('cab9.settings');

    module.controller('SpecialRequirementsController', specialRequirementsController);

    specialRequirementsController.$inject = ['$scope', 'rBRequirements', '$modal', '$state'];
    function specialRequirementsController($scope, rBRequirements, $modal, $state) {
        $scope.requirements = rBRequirements;

        $scope.viewItem = function (row) {
            $modal.open({
                templateUrl: '/webapp/management/settings/specialrequirements/modal.html',
                resolve: {
                    rBReq: function () {
                        return row;
                    }
                },
                controller: ['$scope', '$modalInstance', 'rBReq', function ($scope, $modalInstance, rBReq) {
                    $scope.requirement = rBReq;

                    $scope.save = function () {
                        $scope.requirement.$patch().then(function (res) {
                            swal("Success", "Requirement changed successfully.", "success")
                            $modalInstance.close();
                        }, function (err) {
                            swal("Error", "Something didn't work, please check input and try again", "error");
                        })
                    }
                }]
            });
        }

        $scope.deleteItem = function (row) {
            swal({
                title: "Are you sure?",
                text: "This req. will be deleted permanentaly",
                type: "warning",
                showCancelButton: true,
                confirmButtonText: "Yes, delete it!",
                closeOnConfirm: true
            }, function () {
                row.$delete().success(function () {
                    $state.go('root.settings.specialrequirements', null, {
                        reload: true
                    });
                });
            });
        }
    }
}(angular))