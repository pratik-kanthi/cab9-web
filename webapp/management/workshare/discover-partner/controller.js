(function (angular) {
    var module = angular.module('cab9.workshare');
    module.controller('WorkshareDiscoverPartnerController', WorkshareDiscoverPartnerController);

    WorkshareDiscoverPartnerController.$inject = ['$scope', 'Model', '$state', '$http', '$config', 'rCompany', '$modal', '$timeout'];

    function WorkshareDiscoverPartnerController($scope, Model, $state, $http, $config, rCompany, $modal, $timeout) {
        $scope.company = rCompany[0];
        $scope.markers = [];
        $scope.searchTerm = {
            $: ""
        };
        $scope.showSearch = false;
        $scope.partnerDetails = partnerDetails;
        $scope.showFilterModal = showFilterModal;
        $scope.formatImage = formatImage;
        $scope.fetching = true;
        $scope.height = window.innerHeight;
        $(window).resize(function () {
            $scope.height = window.innerHeight;
            $scope.$apply();
        });
        $http({
            method: 'GET',
            url: $config.API_ENDPOINT + 'api/partners/all',
        }).then(function successCallback(response) {
            $scope.fetching = false;
            $scope.partners = response.data;
            setupMarker();
        }, function errorCallback(error) {
            $scope.fetching = false;
            swal("Get All Partners", error.data.ExceptionMessage, "error");
        });
        $scope.map = {
            center: {
                latitude: $scope.company.BaseLatitude || 54.3781,
                longitude: $scope.company.BaseLongitude || -1.5360
            },
            zoom: 6
        };
        $scope.filters = {
            addressFinder: {
                latitude: null,
                longitude: null
            },
            services: [],
            minDrivers: 0,
            miles: 50
        }

        function setupMarker() {
            $scope.markers.length = 0;
            $scope.partners.map(function (company) {
                marker = {
                    id: company.Id,
                    name: company.Name,
                    alreadyPartner: company.AlreadyPartner,
                    coords: {
                        latitude: company.BaseLatitude,
                        longitude: company.BaseLongitude
                    },
                    mapOptions: {
                        icon: {
                            url: '/includes/images/car1.png',
                            scaledSize: new google.maps.Size(32, 42),
                        },
                        title: company.Name,
                        zIndex: google.maps.Marker.MAX_ZINDEX + 1,
                    },
                    distance: company.Distance || 0
                }
                $scope.markers.push(marker);
            });
        }

        $scope.onMarkerClick = function (event, marker) {
            $scope.searchTerm.$ = marker.name;
        }

        function partnerDetails(tenantId) {
            $state.go('root.workshare.partner.details', {
                Id: tenantId
            });
        }

        function showFilterModal() {
            $modal.open({
                templateUrl: '/webapp/management/workshare/discover-partner/modals/partial.html',
                controller: 'WorkshareFilterModalController',
                size: 'lg',
                resolve: {
                    rFilter: function () {
                        return $scope.filters;
                    }
                }
            }).result.then(function (result) {
                $scope.fetching = true;
                $scope.filters = result;
                var params = {};
                if ($scope.filters.addressFinder && $scope.filters.addressFinder.latitude) {
                    params.latitude = $scope.filters.addressFinder.latitude;
                    params.longitude = $scope.filters.addressFinder.longitude;
                    params.distance = $scope.filters.miles;
                }
                if ($scope.filters.minDrivers > 0) {
                    params.minDrivers = $scope.filters.minDrivers;
                }
                if ($scope.filters.services && $scope.filters.services.length > 0) {
                    params.services = $scope.filters.services.join(",");
                }
                $http.get($config.API_ENDPOINT + 'api/partners/all', {
                        params: params
                    })
                    .success(function (response) {
                        $scope.partners = [];
                        $scope.partners = response;
                        $scope.map.center.latitude = $scope.filters.addressFinder.latitude || $scope.company.BaseLatitude,
                            $scope.map.center.longitude = $scope.filters.addressFinder.longitude || $scope.company.BaseLongitude,
                            $scope.map.zoom = 7;
                        setupMarker();
                        $scope.fetching = false;
                    })
                    .error(function (response) {
                        $scope.fetching = false;
                        swal("Get All Partners", response.data.ExceptionMessage, "error")
                    });
            });
        }

        function formatImage(logoUrl) {
            if (logoUrl) {
                if (logoUrl.slice(0, 4) == 'http') {
                    return logoUrl;
                } else {
                    return window.resourceEndpoint + logoUrl;
                }
            } else {
                return window.endpoint + 'api/imagegen?text=' + (this.Name || '').replace(/ /g, "+");
            }
        }
    }
}(angular));