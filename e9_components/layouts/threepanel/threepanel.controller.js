(function (window, angular) {
    var app = angular.module("framework.UI.structure");

    app.controller('ThreePanelController', ThreePanelController);

    ThreePanelController.$inject = ['$scope'];

    function ThreePanelController($scope) {
        var configs = {
            L: {
                class: 'left-bar',
                width: '480px',
                height: null,
            },
            B: {
                class: 'bottom-bar',
                width: null,
                height: '480px'
            }
        };

        $scope.panel = {
            onPanelResize: angular.noop,
            mode: 'L',
            configs: configs,
            currentConfig: configs.L,
            switchConfig: switchConfig
        };

        function switchConfig(mode) {
            $scope.panel.currentConfig = $scope.panel.configs[mode];
            $scope.panel.mode = mode;
            $scope.panel.onPanelResize();
        }
    };
})(window, angular);