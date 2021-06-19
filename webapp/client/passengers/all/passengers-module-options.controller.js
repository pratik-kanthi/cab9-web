(function (angular) {
    var module = angular.module('cab9.client.passengers');

    module.controller('PassengersModuleOptionsController', passengersModuleOptionsController);

    passengersModuleOptionsController.$inject = ['$scope', '$rootScope', '$modal', 'rData'];

    function passengersModuleOptionsController($scope, $rootScope, $modal, rData) {
        $scope.showStatsModal = showStatsModal;
        $scope.toggleSearch = toggleSearch;
        $scope.newPassenger = newPassenger;

        function newPassenger() {
            var modalInstance = $modal.open({
                templateUrl: '/webapp/common/modals/passenger/create.modal.html',
                controller: 'PassengerItemCreateModalController',
                resolve: {
                    rClientId: function () {
                        return $rootScope.CLIENTID
                    },
                    rNavigateAfterSave: function () {
                        return true;
                    }
                }
            })
        }

        function toggleSearch() {
            $scope.showSearch = !$scope.showSearch;
            if (!$scope.showSearch) {
                $scope.searchTerm.$ = '';
            } else {
                setTimeout(function () {
                    $('#searchTerm').focus()
                }, 500);
            }
        }

        function showStatsModal() {
            $modal.open({
                template: '<div class="modal-header"><button class="close" type="button" ng-click="$close()"><i class="material-icons">close</i></button><h3 class="modal-title">Client Stats</h3></div><div class="modal-body"><div ng-include="\'/webapp/client/passengers/all/passengers-module-stats.partial.html\'"></div></div>',
                controller: 'PassengersModuleStatsController',
                size: 'sm',
                resolve: {
                    rData: function () {
                        return rData;
                    }
                }
            }).result.then(function (result) {
                //proceed.
            });
        }
    }
}(angular))