/// <reference path="item/knownlocation-point-edit.partial.html" />
(function (angular) {
    var module = angular.module('cab9.settings');
    module.controller('KnownLocationCreateController', KnownLocationCreateController);
    module.controller('KnownLocationDetailsController', KnownLocationDetailsController);
    module.controller('KnownLocationPointsController', KnownLocationPointsController);
    module.controller('KnownLocationPointEditController', KnownLocationPointEditController);

    KnownLocationCreateController.$inject = ['$scope', 'Model', '$state'];

    function KnownLocationCreateController($scope, Model, $state) {
        $scope.item = new Model.KnownLocation();
        $scope.displayMode = 'CREATE';
        $scope.saveEdits = saveEdits;
        $scope.cancelEditing = cancelEditing;

        function saveEdits() {
            $scope.item.StopSummary = window.$utilities.formatAddress($scope.item);
            $scope.item.$save().then(function (result) {
                swal('Success', 'The location saved successfully', 'success');
                $state.go('root.settings.knownlocations.viewer.details', {
                    Id: result.data.Id
                });
            }, function () {
                swal('Error', 'The location failed to save.', 'error');
            })
        }

        function cancelEditing() {
            $state.go('root.settings.knownlocations.cards');
        }
    }

    KnownLocationDetailsController.$inject = ['$scope', 'Model', '$state'];

    function KnownLocationDetailsController($scope, Model, $state) {
        $scope.displayMode = 'VIEW';
        $scope.startEditing = startEditing;
        $scope.saveEdits = saveEdits;
        $scope.cancelEditing = cancelEditing;

        function startEditing() {
            $scope.displayMode = 'EDIT'
        }

        function saveEdits() {
            $scope.item.$patch().then(function (response) {
                swal('Success', 'The location saved successfully', 'success');
                $scope.item.Latitude = response.data.Latitude;
                $scope.item.Longitude = response.data.Longitude;
                $scope.displayMode = 'VIEW';
            }, function () {
                swal('Error', 'The location failed to save.', 'error');
            })
        }

        function cancelEditing() {
            $scope.item.$rollback();
            $scope.displayMode = 'VIEW';
        }
    }

    KnownLocationPointsController.$inject = ['$scope', 'Model', '$modal', '$config'];

    function KnownLocationPointsController($scope, Model, $modal, $config) {
        $scope.newPoint = newPoint;
        $scope.openPoint = openPoint;
        $scope.pointAccessors = {
            Id: function (item) {
                return item.Id;
            },
            Title: function (item) {
                return item.Name;
            },
            LogoUrl: function (item) {
                if (item.ImageUrl) {
                    if (item.ImageUrl.slice(0, 4) == 'http') {
                        return item.ImageUrl;
                    } else {
                        return $config.RESOURCE_ENDPOINT + item.ImageUrl;
                    }
                } else {
                    var k = "AIzaSyAtRDZdVGx8r7tFPZR7h2D95VwsSyGqz-0";
                    return "https://maps.googleapis.com/maps/api/streetview?size=400x400&location=" + item.Latitude + "," + item.Longitude + "&fov=90&heading=" + item.Bearing + "&pitch=" + item.Pitch + "&key=" + k;
                    //return $config.API_ENDPOINT + 'api/imagegen?text=' + item.Name.replace(/ /g, "+");
                }
            }
        };

        function newPoint() {
            $modal.open({
                templateUrl: '/webapp/management/settings/known-locations/item/knownlocation-point-edit.partial.html',
                controller: 'KnownLocationPointEditController',
                size: 'lg',
                background: 'static',
                backdrop: 'static',
                resolve: {
                    rMode: function () {
                        return 'CREATE';
                    },
                    rPickUpPoint: function () {
                        var a = new Model.KnownPickupPoint();
                        a.Latitude = $scope.item.Latitude;
                        a.Longitude = $scope.item.Longitude;
                        a.KnownLocationId = $scope.item.Id;
                        return a;
                    }
                }
            }).result.then(function () {
                Model.KnownPickupPoint.query().filter('KnownLocationId', 'eq', "guid'" + $scope.item.Id + "'").execute().then(function (data) {
                    $scope.item.KnownPickupPoints = data;
                })
            })
        }

        function openPoint(p) {
            $modal.open({
                templateUrl: '/webapp/management/settings/known-locations/item/knownlocation-point-edit.partial.html',
                controller: 'KnownLocationPointEditController',
                size: 'lg',
                background: 'static',
                backdrop: 'static',
                resolve: {
                    rMode: function () {
                        return 'EDIT';
                    },
                    rPickUpPoint: function () {
                        return new Model.KnownPickupPoint(p);
                    }
                }
            }).result.then(function () {
                Model.KnownPickupPoint.query().filter('KnownLocationId', 'eq', "guid'" + $scope.item.Id + "'").execute().then(function (data) {
                    $scope.item.KnownPickupPoints = data;
                })
            })
        }
    }

    KnownLocationPointEditController.$inject = ['$scope', '$modalInstance', 'rMode', 'rPickUpPoint', 'ImageUpload'];

    function KnownLocationPointEditController($scope, $modalInstance, rMode, rPickUpPoint, ImageUpload) {
        $scope.displayMode = rMode;
        $scope.save = save;
        $scope.pickUpPoint = rPickUpPoint;
        $scope.cancelEdit = cancelEdit;
        $scope.removePoint = removePoint;

        function setupMaps() {
            $scope.map = new google.maps.Map(document.getElementById("map-div"), {
                center: new google.maps.LatLng($scope.pickUpPoint.Latitude, $scope.pickUpPoint.Longitude),
                zoom: 17,
                zoomControl: false,
                zoomControlOptions: {
                    position: google.maps.ControlPosition.RIGHT_CENTER
                },
                streetViewControlOptions: {
                    position: google.maps.ControlPosition.RIGHT_TOP
                },
                styles: [{
                    featureType: "all",
                    stylers: [{
                        saturation: 0
                    }, {
                        hue: "#e7ecf0"
                    }]
                }, {
                    featureType: "road",
                    stylers: [{
                        saturation: -70
                    }]
                }, {
                    featureType: "water",
                    stylers: [{
                        visibility: "simplified"
                    }, {
                        saturation: -60
                    }]
                }]
            });
            setTimeout(function () {
                function update() {
                    $scope.pickUpPoint.Latitude = $scope.panorama.getPosition().lat();
                    $scope.pickUpPoint.Longitude = $scope.panorama.getPosition().lng();
                    $scope.pickUpPoint.Bearing = $scope.panorama.getPov().heading;
                    $scope.pickUpPoint.Pitch = $scope.panorama.getPov().pitch;
                }
                google.maps.event.trigger($scope.map, "resize");
                google.maps.event.addListener($scope.map, "dragend", function () {
                    $scope.pickUpPoint.Latitude = $scope.map.getCenter().lat(),
                        $scope.pickUpPoint.Longitude = $scope.map.getCenter().lng(),
                        $scope.panorama.setPosition($scope.map.getCenter()),
                        $scope.map.setStreetView($scope.panorama),
                        $scope.$apply()
                })
                $scope.panorama = new google.maps.StreetViewPanorama(document.getElementById("pano-div"), {
                    position: $scope.map.getCenter(),
                    pov: {
                        heading: $scope.pickUpPoint.Bearing || 34,
                        pitch: $scope.pickUpPoint.Pitch || 10
                    }
                });
                $scope.map.setStreetView($scope.panorama);
                $scope.panorama.addListener("position_changed", function () {
                        $scope.map.setCenter($scope.panorama.getPosition()),
                            $scope.pickUpPoint.Latitude = $scope.panorama.getPosition().lat(),
                            $scope.pickUpPoint.Longitude = $scope.panorama.getPosition().lng(),
                            update(),
                            $scope.$apply()
                    }),
                    $scope.panorama.addListener("pov_changed", function () {
                        update(),
                            $scope.$apply()
                    })
            }, 1000);
        }


        function save() {
            if (rMode == 'EDIT') {
                if ($scope.pickUpPoint.$image) {
                    ImageUpload.upload($scope.pickUpPoint.$image, {
                        type: 'PickupPoint',
                        id: $scope.pickUpPoint.Id
                    }).then(function (response) {
                        $scope.pickUpPoint.ImageUrl = response.data[0];
                        $scope.pickUpPoint.$patch().then(function (result) {
                            swal('Success', 'The point saved successfully', 'success');
                            $modalInstance.close();
                        }, function () {
                            swal('Error', 'The point failed to save.', 'error');
                        });
                    }, function () {
                        swal('Error', 'Image upload failed', 'error');
                    }, function (p) {
                        $scope.progress = p;
                    })
                } else {
                    $scope.pickUpPoint.$patch().then(function (result) {
                        swal('Success', 'The point saved successfully', 'success');
                        $modalInstance.close();
                    }, function () {
                        swal('Error', 'The point failed to save.', 'error');
                    });
                }
            } else {
                $scope.pickUpPoint.$save().then(function (result) {
                    if ($scope.pickUpPoint.$image) {
                        ImageUpload.upload($scope.pickUpPoint.$image, {
                            type: 'PickupPoint',
                            id: result.data.Id
                        }).then(function (path) {
                            $scope.pickUpPoint.ImageUrl = response.data[0];
                            $scope.pickUpPoint.$patch().then(function (result) {
                                swal('Success', 'The point saved successfully', 'success');
                                $modalInstance.close();
                            }, function () {
                                swal('Error', 'The point failed to save.', 'error');
                            });
                        }, function () {
                            swal('Error', 'Image upload failed', 'error');
                        }, function (p) {
                            $scope.progress = p;
                        });
                    } else {
                        swal('Success', 'The point saved successfully', 'success');
                        $modalInstance.close();
                    }
                }, function () {
                    swal('Error', 'The point failed to save.', 'error');
                });
            }
        }

        function cancelEdit() {
            $modalInstance.close();
        }

        function removePoint() {
            $scope.pickUpPoint.$delete().then(function (result) {
                swal('Success', 'The point has been removed successfully', 'success');
                $modalInstance.close();
            }, function () {
                swal('Error', 'The point failed to delete.', 'error');
            });
        }

        setTimeout(function () {
            setupMaps();
        }, 1000);
    }
}(angular));