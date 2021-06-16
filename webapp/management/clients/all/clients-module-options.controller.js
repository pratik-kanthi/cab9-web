(function(angular) {
    var module = angular.module('cab9.clients');

    module.controller('ClientsModuleOptionsController', clientsModuleOptionsController);

    clientsModuleOptionsController.$inject = ['$scope', '$modal', 'rData'];

    function clientsModuleOptionsController($scope, $modal, rData) {
        $scope.showStatsModal = showStatsModal;
        $scope.toggleSearch = toggleSearch;
        $scope.openClientTypeModal = openClientTypeModal;



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
                template: '<div class="modal-header"><button class="close" type="button" ng-click="$close()"><i class="material-icons">clear</i></button><h3 class="modal-title">Client Stats</h3></div><div class="modal-body"><div ng-include="\'/webapp/management/clients/all/clients-module-stats.partial.html\'"></div></div>',
                controller: 'ClientsModuleStatsController',
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

        function openClientTypeModal() {
            $modal.open({
                templateUrl: '/webapp/management/clients/modals/client-types-modal.partial.html',
                controller: 'ClientTypesModalController',
                size: 'lg',
                resolve: {
                    rData: ['Model', '$stateParams', 'LookupCache', function(Model, $stateParams, LookupCache) {
                        return Model.ClientType
                            .query()
                            .trackingEnabled()
                            .execute()
                            .then(function(data) {
                                LookupCache.ClientType = data;
                                LookupCache.ClientType.$updated = new moment();
                                return LookupCache.ClientType;
                            });
                    }]
                }
            }).result.then(function(result) {

            });
        }
    }
}(angular))
