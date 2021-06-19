(function (angular) {
    var module = angular.module('framework.directives.UI');

    module.directive('infocard', infocard);

    infocard.$inject = ['$parse'];
    function infocard($parse) {
        return {
            restrict: 'AE',
            replace: true,
            scope: true,
            templateUrl: '/e9_components/directives/infocard-template.html',
            link: function (scope, elm, attrs) {
                scope.item = $parse(attrs.item)(scope);
                scope.accessor = $parse(attrs.accessor)(scope);
                scope.$watch(function () { return $parse(attrs.item)(scope); }, function (newVal) { scope.item = newVal; });
                scope.$watch(function () { return $parse(attrs.accessor)(scope); }, function (newVal) { scope.accessor = newVal; });
            }

        }
    }
}(angular));
