(function (angular) {
    var module = angular.module('cab9.client.dashboard');

    module.controller('DashboardController', dashboardController);

    dashboardController.$inject = ['$scope', '$UI', '$config', '$http', '$q', '$filter', '$timeout', '$rootScope'];

    function dashboardController($scope, $UI, $config, $http, $q, $filter, $timeout, $rootScope) {
        if ($rootScope.PERMISSIONS.permissions[0] != "superadmin") {
            $rootScope.reportFilters.ClientStaffId = $rootScope.USER.Claims.ClientStaffId[0];
        }
        $scope.dataRequestsCount = null;
        var $grid = null;
        var packeryDiv = document.querySelector(".grid");

        function setupMasonry() {
            $grid = new Packery(packeryDiv, {
                itemSelector: '.grid-item',
                isInitLayout: false,
                percentPosition: true,
                columnWidth: '#width-sizer',
                gutter: 0
            });

            var packeryOrder = JSON.parse(localStorage.getItem("clientDashboardOrder"));
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
                    localStorage.setItem("clientDashboardOrder", JSON.stringify(ordered));
                }
            );

            //var $items = $(packeryDiv).find('.grid-item').draggable();
            //$grid.bindUIDraggableEvents($items);
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
                }, 10);
                $timeout(function () {
                    $scope.$apply();
                }, 1000);
            }
        });
    }
}(angular));