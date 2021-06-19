(function (angular) {
    var module = angular.module('cab9.vehicles');

    module.controller('VehiclesModuleOptionsController', vehiclesModuleOptionsController);

    vehiclesModuleOptionsController.$inject = ['$scope', '$modal'];

    function vehiclesModuleOptionsController($scope, $modal) {
        $scope.showStatsModal = showStatsModal;
        $scope.toggleSearch = toggleSearch;
        $scope.openVehicleClassModal = openVehicleClassModal;

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
                template: '<div class="modal-header"><button class="close" type="button" ng-click="$close()"><i class="material-icons">close</i></button><h3 class="modal-title">Driver Stats</h3></div><div class="modal-body"><div ng-include="\'/webapp/management/vehicles/all/vehicles-module-stats.partial.html\'"></div></div>',
                controller: 'VehiclesModuleStatsController',
                size: 'sm',
                resolve: {
                    rData: ['Model', 'Auth', function(Model, Auth) {
                        return Model.Vehicle
                            .query()
                            .filter("DriverId eq guid'" + Auth.getSession().Claims.DriverId[0] + "'")
                            .include('Type')
                            .include('Class')
                            .include('Driver')
                            .include('VehicleTags')
                            .execute();
                    }]
                }
            }).result.then(function (result) {
                //proceed.
            });
        }

        function openVehicleClassModal() {
            $modal.open({
                templateUrl: '/webapp/management/vehicles/modals/vehicle-classes-modal.partial.html',
                controller: 'VehicleClassesModalController',
                size: 'lg',
                resolve: {
                    rData: ['Model', '$stateParams', 'LookupCache', function (Model, $stateParams, LookupCache) {
                        return Model.VehicleClass
                            .query()
                            .trackingEnabled()
                            .execute()
                            .then(function (data) {
                                LookupCache.VehicleClass = data;
                                LookupCache.VehicleClass.$updated = new moment();
                                return LookupCache.VehicleClass;
                            });
                    }]
                }
            }).result.then(function (result) {

            });
        }
    }
}(angular))