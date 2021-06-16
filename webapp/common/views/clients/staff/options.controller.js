(function(angular) {
    var module = angular.module('cab9.common');

    module.controller('ClientStaffOptionsController', clientStaffOptionsController);

    clientStaffOptionsController.$inject = ['$scope', '$stateParams', '$state', '$q', '$config', '$modal', '$UI', '$http', 'Model', 'rData', 'rAccessors', 'rCreateState', 'rNavCards', 'rNavTable'];

    function clientStaffOptionsController($scope, $stateParams, $state, $q, $config, $modal, $UI, $http, Model, rData, rAccessors, rCreateState, rNavCards, rNavTable) {
        $scope.staff = rData;
        $scope.openStaffCreate = openStaffCreate;
        $scope.toggleSearch = toggleSearch;
        $scope.navCards = rNavCards;
        $scope.navTable = rNavTable;

        function toggleSearch() {
            $scope.showSearch = !$scope.showSearch;
            if (!$scope.showSearch) {
                $scope.searchTerm.$ = '';
            } else if (!$scope.showSearch && $scope.serverSearchTerm) {
                $scope.serverSearchTerm.$ = '';
            } else {
                setTimeout(function() {
                    $('#searchTerm').focus()
                }, 500);
            }
        }


        function openStaffCreate(type) {
            if (type == "SuperAdmin")
                $state.go(rCreateState, {
                    Id: $stateParams.Id,
                    superAdmin: true
                })
            else
                $state.go(rCreateState, {
                    Id: $stateParams.Id
                })
        }
    }
}(angular))
