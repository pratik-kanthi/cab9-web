(function (angular) {
    var module = angular.module('cab9.staff');
    module.controller('StaffModuleOptionController', staffModuleOptionController);
    staffModuleOptionController.$inject = ['$scope', '$modal', 'rData'];

    function staffModuleOptionController($scope, $modal, rData) {

        $scope.toggleSearch = toggleSearch;
        $scope.showStatsModal = showStatsModal;
        $scope.openStaffTypeModal = openStaffTypeModal;

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
                template: '<div class="modal-header"><button class="close" type="button" ng-click="$close()"><i class="material-icons">clear</i></button><h3 class="modal-title">Staff Stats</h3></div><div class="modal-body"><div ng-include="\'/webapp/management/staff/all/staff-module-stats.partial.html\'"></div></div>',
                controller: 'StaffModuleStatsController',
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

        function openStaffTypeModal() {
            $modal.open({
                templateUrl: '/webapp/management/staff/modals/staff-types-modal.partial.html',
                controller: 'StaffTypesModalController',
                size: 'lg',
                resolve: {
                    rData: ['Model', '$stateParams', 'LookupCache', function (Model, $stateParams, LookupCache) {
                        return Model.StaffType
                            .query()
                            .execute()
                            .trackingEnabled()
                            .then(function (data) {
                                LookupCache.StaffType = data;
                                LookupCache.StaffType.$updated = new moment();
                                return LookupCache.StaffType;
                            });
                    }]
                }
            }).result.then(function (result) {

            });
        }

    }
})(angular)