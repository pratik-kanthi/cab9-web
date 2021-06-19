(function (angular) {
    var module = angular.module('cab9.utilities');

    module.controller('DocumentsOptionsController', documentsOptionsController);

    documentsOptionsController.$inject = ['$scope'];

    function documentsOptionsController($scope) {
        $scope.toggleSearch = toggleSearch;

        function toggleSearch() {
            $scope.showSearch = !$scope.showSearch;
            if (!$scope.showSearch) {
                $scope.searchTerm.$ = '';
            } else {
                setTimeout(function () {
                    $('#searchTerm').focus()
                    $scope.$parent.setupGrid();
                }, 500);
            }

        }
    }
}(angular))