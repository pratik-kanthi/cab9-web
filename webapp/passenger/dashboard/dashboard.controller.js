(function (angular) {
    var module = angular.module('cab9.passenger.dashboard');

    module.controller('DashboardController', dashboardController);

    dashboardController.$inject = ['$scope', '$UI', '$config', '$http', '$q', '$filter', '$timeout', '$rootScope'];

    function dashboardController($scope, $UI, $config, $http, $q, $filter, $timeout, $rootScope) {
        $scope.dataRequestsCount = null;
        var $grid = null;
        var packeryDiv = document.querySelector(".grid");

        function setupMasonry() {
            $grid = new Packery(packeryDiv, {
                itemSelector: '.grid-item',
                isInitLayout: false,
                percentPosition: true,
                gutter: 0
            });

            var packeryOrder = JSON.parse(localStorage.getItem("dashboardOrder"));
            if (packeryOrder) {
                var _items = $grid.items.slice(0);

                for (i = 0; i < _items.length; i++) {
                    var _sortKey = _items[i].element.parentElement.getAttributeNode("order").value;
                    var index = packeryOrder.indexOf(_sortKey);
                    $grid.items[index] = _items[i];
                }
            }

            $grid.layout();

            $grid.on('dragItemPositioned',
                function (event, draggedItem) {
                    var elements = $($grid.getItemElements());
                    var ordered = [];
                    for (i = 0; i < elements.length; i++) {
                        ordered.push(elements[i].parentElement.getAttributeNode("order").value);
                    }
                    localStorage.setItem("dashboardOrder", JSON.stringify(ordered));
                }
            );

            var $items = $(packeryDiv).find('.grid-item').draggable();
            $grid.bindUIDraggableEvents($items);
        }

        $rootScope.$on("Data Loading", function () {
            if ($scope.dataRequestsCount) {
                $scope.dataRequestsCount += 1;
            } else {
                $scope.dataRequestsCount = 1;
            }
        });

        $rootScope.$on("Data Loaded", function () {
            $scope.dataRequestsCount -= 1;
            if ($scope.dataRequestsCount == 0) {
                $timeout(function () {
                    setupMasonry();
                    $scope.$apply();
                }, 10);
            }
        });
    }
}(angular));