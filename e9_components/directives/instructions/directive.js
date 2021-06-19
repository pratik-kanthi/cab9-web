(function (angular) {

    var module = angular.module('framework.UI');

    module.directive('instructions', instructionsDirective);

    instructionsDirective.$inject = [];

    function instructionsDirective() {
        return {
            scope: {
                instructionsObj: '='
            },
            link: function(scope, elem, attrs){
                scope.i = 0; // Initially the index is at the first image

                scope.next = function() {
                    scope.i < scope.instructionsObj.instructions.length - 1 ? scope.i++ : scope.i = 0;
                };

                scope.prev = function() {
                    scope.i > 0 ? scope.i-- : scope.i = scope.instructionsObj.instructions.length - 1;
                };
            },
            templateUrl: '/e9_components/directives/instructions/partial.html'
        }
    }
}(angular))   