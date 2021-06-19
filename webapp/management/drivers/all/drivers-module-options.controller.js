(function(angular) {
    var module = angular.module('cab9.drivers');

    module.controller('DriversModuleOptionsController', driversModuleOptionsController);

    driversModuleOptionsController.$inject = ['$scope', '$modal', 'rData'];

    function driversModuleOptionsController($scope, $modal, rData) {
        $scope.toggleSearch = toggleSearch;
        $scope.showStatsModal = showStatsModal;
        $scope.openDriverTypeModal = openDriverTypeModal;

        function toggleSearch() {
            $scope.showSearch = !$scope.showSearch;
            if (!$scope.showSearch && $scope.searchTerm) {
                $scope.searchTerm.$ = '';
            } else if (!$scope.showSearch && $scope.serverSearchTerm) {
                $scope.serverSearchTerm.$ = '';
            } else {
                setTimeout(function() {
                    $('#searchTerm').focus()
                }, 500);
            }
        }

        function showStatsModal() {
            $modal.open({
                template: '<div class="modal-header"><button class="close" type="button" ng-click="$close()"><i class="material-icons">close</i></button><h3 class="modal-title">Driver Stats</h3></div><div class="modal-body"><div ng-include="\'/webapp/management/drivers/all/drivers-module-stats.partial.html\'"></div></div>',
                controller: 'DriversModuleStatsController',
                size: 'sm',
                resolve: {
                    rData: function() {
                        return rData;
                    }
                }
            }).result.then(function(result) {
                //proceed.
            });
        }

        function openDriverTypeModal() {
            $modal.open({
                templateUrl: '/webapp/management/drivers/modals/driver-types-modal.partial.html',
                controller: 'DriverTypesModalController',
                size: 'lg',
                resolve: {
                    rData: ['Model', '$stateParams', 'LookupCache', function(Model, $stateParams, LookupCache) {
                        return Model.DriverType
                            .query()
                            .include('DefaultDriverPaymentModel')
                            .trackingEnabled()
                            .execute()
                            .then(function(data) {
                                LookupCache.DriverType = data;
                                LookupCache.DriverType.$updated = new moment();
                                return LookupCache.DriverType;
                            });
                    }],
                    'rPaymentModels': ['Model', function(Model) {
                        return Model.DriverPaymentModel
                            .query()
                            .select('Id, Name')
                            .parseAs(function(item) {
                                this.Id = item.Id;
                                this.Name = item.Name
                            })
                            .execute();
                    }]
                }
            }).result.then(function(result) {

            });
        }
    }
})(angular);
