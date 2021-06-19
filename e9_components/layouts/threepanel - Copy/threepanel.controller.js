(function (window, angular) {
    var app = angular.module("framework.UI.structure");

    app.controller('ThreePanelController', ThreePanelController);

    ThreePanelController.$inject = ['$scope'];

    function ThreePanelController($scope) {
        $scope.bars = {
            onPanelResize: angular.noop,
            left: {
                options: ['48px', '350px', '700px'],
                currentWidth: '350px',
                open: function () {
                    var index = this.options.indexOf(this.currentWidth);
                    index++;
                    if (index == this.options.length) return;
                    else this.currentWidth = this.options[index];
                    $scope.bars.onPanelResize();
                },
                close: function () {
                    var index = this.options.indexOf(this.currentWidth);
                    index--;
                    if (index == -1) return;
                    else this.currentWidth = this.options[index];
                    $scope.bars.onPanelResize();
                }
            },
            bottom: {
                options: ['48px', '350px', '600px'],
                currentHeight: '48px',
                open: function () {
                    var index = this.options.indexOf(this.currentHeight);
                    index++;
                    if (index == this.options.length) return;
                    else this.currentHeight = this.options[index];
                    $scope.bars.onPanelResize();
                },
                close: function () {
                    var index = this.options.indexOf(this.currentHeight);
                    index--;
                    if (index == -1) return;
                    else this.currentHeight = this.options[index];
                    $scope.bars.onPanelResize();
                }
            }
        };
    };
})(window, angular);