(function (angular) {
    var module = angular.module('cab9.passengers');

    module.controller('PassengersModuleOptionsController', passengersModuleOptionsController);

    passengersModuleOptionsController.$inject = ['$scope', '$modal', 'rStatsData'];

    function passengersModuleOptionsController($scope, $modal, rStatsData) {
        $scope.showStatsModal = showStatsModal;
        $scope.toggleSearch = toggleSearch;
        $scope.newPassenger = newPassenger;

        function newPassenger() {
            var modalInstance = $modal.open({
                templateUrl: '/webapp/common/modals/passenger/create.modal.html',
                controller: 'PassengerItemCreateModalController',
                resolve:{
                    rClientId: function () {
                        return null
                    },
                    rNavigateAfterSave: function () {
                        return true;
                    }
                }
            })
        }

        function toggleSearch() {
            $scope.showSearch = !$scope.showSearch;
            if (!$scope.showSearch && $scope.searchTerm) {
                $scope.searchTerm.$ = '';
            } else if (!$scope.showSearch && $scope.serverSearchTerm) {
                $scope.serverSearchTerm.$ = '';
            } else {
                setTimeout(function () {
                    $('#searchTerm').focus()
                }, 500);
            }
        }

        function showStatsModal() {
            $modal.open({
                template: '<div class="modal-header"><button class="close" type="button" ng-click="$close()"><i class="material-icons">close</i></button><h3 class="modal-title">Client Stats</h3></div><div class="modal-body"><div ng-include="\'/webapp/management/passengers/all/passengers-module-stats.partial.html\'"></div></div>',
                controller: 'PassengersModuleStatsController',
                size: 'sm',
                resolve: {
                    rStatsData: function () {
                        return rStatsData;
                    }
                }
            }).result.then(function (result) {
                //proceed.
            });
        }
    }
}(angular))